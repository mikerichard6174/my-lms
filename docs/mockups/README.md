# Interface Mockups

This folder contains quick visual mockups generated with Python and Pillow to communicate the current authentication landing page and student dashboard layout. The artwork mirrors the structure of the working HTML pages without requiring the full project stack to be running.

| View | Description | How to generate |
| --- | --- | --- |
| Multi-role sign-in | Entry point where families, teachers, and administrators authenticate to access their dedicated portals. | Run `python docs/mockups/generate_mockups.py` to export `login-page.png` locally. |
| Student dashboard | Student-facing home that surfaces progress, schedule, and quick links into lessons. | Run `python docs/mockups/generate_mockups.py` to export `student-dashboard.png` locally. |

To recreate or update these visuals, edit `docs/mockups/generate_mockups.py` (see below) and execute `python docs/mockups/generate_mockups.py`. The script draws simplified wireframes so designers and stakeholders can review layout changes without checking binary assets into source control.

```python
from PIL import Image, ImageDraw, ImageFont

# ... see generate_mockups.py for the implementation used to render the PNGs
```
