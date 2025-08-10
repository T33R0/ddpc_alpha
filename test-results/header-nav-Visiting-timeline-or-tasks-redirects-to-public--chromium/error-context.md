# Page snapshot

```yaml
- banner:
  - link "ddpc alpha":
    - /url: /
  - navigation:
    - link "Vehicles":
      - /url: /vehicles
    - link "About":
      - /url: /about
    - link "Timeline":
      - /url: /timeline
    - link "Tasks":
      - /url: /tasks
  - button "All vehicles"
  - textbox "you@example.com"
  - button "Magic link"
  - button "Google"
- main:
  - heading "Timeline" [level=1]
  - text: Vehicle
  - combobox "Vehicle":
    - option "All vehicles" [selected]
  - status:
    - text: Pick a vehicle to view timeline.
    - link "Go to vehicles":
      - /url: /vehicles
```