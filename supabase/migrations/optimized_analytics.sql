-- Optimized Analytics Functions
-- These replace the N+1 queries with single efficient queries

-- Function to get all vehicle analytics in one query
CREATE OR REPLACE FUNCTION get_vehicle_analytics(
  vehicle_ids UUID[],
  thirty_days_ago TIMESTAMPTZ
)
RETURNS TABLE (
  vehicle_id UUID,
  upcoming_tasks BIGINT,
  last_service_date TIMESTAMPTZ,
  events_30_days BIGINT,
  days_since_last_service INTEGER,
  avg_days_between_services INTEGER,
  last_event_date TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH
    -- Upcoming tasks (PLANNED + IN_PROGRESS)
    upcoming_tasks AS (
      SELECT
        vehicle_id,
        COUNT(*) as count
      FROM work_item
      WHERE vehicle_id = ANY(vehicle_ids)
        AND status IN ('PLANNED', 'IN_PROGRESS')
      GROUP BY vehicle_id
    ),

    -- Service events with ranking for last service
    service_events AS (
      SELECT
        vehicle_id,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY vehicle_id ORDER BY created_at DESC) as rn,
        LAG(created_at) OVER (PARTITION BY vehicle_id ORDER BY created_at DESC) as prev_service_date
      FROM event
      WHERE vehicle_id = ANY(vehicle_ids)
        AND type = 'SERVICE'
    ),

    -- Last service per vehicle
    last_services AS (
      SELECT
        vehicle_id,
        created_at as last_service_date,
        prev_service_date
      FROM service_events
      WHERE rn = 1
    ),

    -- Events in last 30 days
    recent_events AS (
      SELECT
        vehicle_id,
        COUNT(*) as count
      FROM event
      WHERE vehicle_id = ANY(vehicle_ids)
        AND created_at >= thirty_days_ago
      GROUP BY vehicle_id
    ),

    -- Last event of any type per vehicle
    last_any_events AS (
      SELECT
        vehicle_id,
        created_at as last_event_date
      FROM (
        SELECT
          vehicle_id,
          created_at,
          ROW_NUMBER() OVER (PARTITION BY vehicle_id ORDER BY created_at DESC) as rn
        FROM event
        WHERE vehicle_id = ANY(vehicle_ids)
      ) ranked
      WHERE rn = 1
    ),

    -- Average days between services (last 12 months)
    service_intervals AS (
      SELECT
        vehicle_id,
        CASE
          WHEN COUNT(*) >= 2 THEN
            ROUND(AVG(EXTRACT(EPOCH FROM (created_at - prev_service_date)) / 86400))
          ELSE NULL
        END as avg_days
      FROM (
        SELECT
          vehicle_id,
          created_at,
          LAG(created_at) OVER (PARTITION BY vehicle_id ORDER BY created_at DESC) as prev_service_date
        FROM event
        WHERE vehicle_id = ANY(vehicle_ids)
          AND type = 'SERVICE'
          AND created_at >= NOW() - INTERVAL '12 months'
      ) intervals
      GROUP BY vehicle_id
    )

  SELECT
    COALESCE(ut.vehicle_id, ls.vehicle_id, re.vehicle_id, lae.vehicle_id, si.vehicle_id) as vehicle_id,
    COALESCE(ut.count, 0) as upcoming_tasks,
    ls.last_service_date,
    COALESCE(re.count, 0) as events_30_days,
    CASE
      WHEN ls.last_service_date IS NOT NULL THEN
        GREATEST(0, EXTRACT(EPOCH FROM (NOW() - ls.last_service_date)) / 86400)::INTEGER
      ELSE NULL
    END as days_since_last_service,
    si.avg_days as avg_days_between_services,
    lae.last_event_date
  FROM upcoming_tasks ut
  FULL OUTER JOIN last_services ls ON ut.vehicle_id = ls.vehicle_id
  FULL OUTER JOIN recent_events re ON COALESCE(ut.vehicle_id, ls.vehicle_id) = re.vehicle_id
  FULL OUTER JOIN last_any_events lae ON COALESCE(ut.vehicle_id, ls.vehicle_id, re.vehicle_id) = lae.vehicle_id
  FULL OUTER JOIN service_intervals si ON COALESCE(ut.vehicle_id, ls.vehicle_id, re.vehicle_id, lae.vehicle_id) = si.vehicle_id
  WHERE COALESCE(ut.vehicle_id, ls.vehicle_id, re.vehicle_id, lae.vehicle_id, si.vehicle_id) = ANY(vehicle_ids);
$$;

-- Function to get dashboard overview analytics
CREATE OR REPLACE FUNCTION get_dashboard_analytics(user_id UUID)
RETURNS TABLE (
  total_vehicles BIGINT,
  upcoming_tasks BIGINT,
  recent_events BIGINT,
  avg_days_between_services INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH
    user_garages AS (
      SELECT garage_id
      FROM garage_member
      WHERE user_id = $1
    ),
    user_vehicles AS (
      SELECT id as vehicle_id
      FROM vehicle
      WHERE garage_id IN (SELECT garage_id FROM user_garages)
    ),
    vehicle_stats AS (
      SELECT
        COUNT(*) as total_vehicles,
        COUNT(DISTINCT CASE WHEN wi.status IN ('PLANNED', 'IN_PROGRESS') THEN wi.vehicle_id END) as vehicles_with_upcoming,
        COUNT(DISTINCT CASE WHEN e.created_at >= NOW() - INTERVAL '30 days' THEN e.vehicle_id END) as vehicles_with_recent_events
      FROM user_vehicles uv
      LEFT JOIN work_item wi ON wi.vehicle_id = uv.vehicle_id AND wi.status IN ('PLANNED', 'IN_PROGRESS')
      LEFT JOIN event e ON e.vehicle_id = uv.vehicle_id AND e.created_at >= NOW() - INTERVAL '30 days'
    ),
    upcoming_count AS (
      SELECT COUNT(*) as count
      FROM work_item wi
      JOIN user_vehicles uv ON wi.vehicle_id = uv.vehicle_id
      WHERE wi.status IN ('PLANNED', 'IN_PROGRESS')
    ),
    recent_events_count AS (
      SELECT COUNT(*) as count
      FROM event e
      JOIN user_vehicles uv ON e.vehicle_id = uv.vehicle_id
      WHERE e.created_at >= NOW() - INTERVAL '30 days'
    ),
    avg_service_interval AS (
      SELECT
        ROUND(AVG(avg_interval)) as avg_days
      FROM (
        SELECT
          vehicle_id,
          CASE
            WHEN COUNT(*) >= 2 THEN
              AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at DESC))) / 86400)
            ELSE NULL
          END as avg_interval
        FROM event
        WHERE vehicle_id IN (SELECT vehicle_id FROM user_vehicles)
          AND type = 'SERVICE'
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY vehicle_id
      ) vehicle_intervals
      WHERE avg_interval IS NOT NULL
    )

  SELECT
    vs.total_vehicles,
    uc.count as upcoming_tasks,
    rec.count as recent_events,
    asi.avg_days as avg_days_between_services
  FROM vehicle_stats vs
  CROSS JOIN upcoming_count uc
  CROSS JOIN recent_events_count rec
  CROSS JOIN avg_service_interval asi;
$$;

-- Add performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_item_vehicle_status
ON work_item (vehicle_id, status)
WHERE status IN ('PLANNED', 'IN_PROGRESS');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_vehicle_type_created
ON event (vehicle_id, type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_vehicle_created
ON event (vehicle_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicle_garage_id
ON vehicle (garage_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_garage_member_user_garage
ON garage_member (user_id, garage_id);

-- Add comments for documentation
COMMENT ON FUNCTION get_vehicle_analytics(UUID[], TIMESTAMPTZ) IS
'Replaces 4 separate queries with one optimized query using window functions and aggregations';

COMMENT ON FUNCTION get_dashboard_analytics(UUID) IS
'Provides dashboard overview metrics with minimal database queries';
