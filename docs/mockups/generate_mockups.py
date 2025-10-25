"""Generate simple visual mockups of key LMS interfaces."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BASE_PATH = Path(__file__).parent


def load_fonts():
    """Load fonts with sensible fallbacks."""
    try:
        font_large = ImageFont.truetype('DejaVuSans-Bold.ttf', 48)
        font_medium = ImageFont.truetype('DejaVuSans-Bold.ttf', 30)
        font_body = ImageFont.truetype('DejaVuSans.ttf', 24)
    except OSError:
        # Fall back to the default bitmap font if the expected fonts are unavailable.
        font_large = font_medium = font_body = ImageFont.load_default()
    return font_large, font_medium, font_body


def draw_login_mockup(font_large, font_medium, font_body):
    size = (1280, 720)
    img = Image.new('RGB', size, '#eef3ff')
    draw = ImageDraw.Draw(img)

    hero_rect = (80, 60, 1200, 160)
    draw.rounded_rectangle(hero_rect, radius=40, fill='#ffffff')
    draw.text((110, 90), 'Welcome to My Learning Hub', font=font_large, fill='#1b3a8a')
    draw.text(
        (110, 150),
        'Choose your role to access personalized tools and progress tracking.',
        font=font_body,
        fill='#3d4a6d',
    )

    cards = [
        ('Student Sign In', 'Lessons, schedule, and badges', 'Enter Student Dashboard'),
        ('Parent Sign In', 'Review goals, schedules, and grades', 'Open Parent Dashboard'),
        ('Teacher Sign In', 'Plan lessons and monitor classes', 'Launch Teacher Center'),
        ('Administrator Sign In', 'Manage users and curriculum', 'Enter Admin Control Center'),
    ]

    card_width = 520
    card_height = 120
    start_x = 80
    start_y = 220
    vertical_gap = 20
    button_height = 38

    for index, (title, body, button) in enumerate(cards):
        top = start_y + index * (card_height + vertical_gap)
        rect = (start_x, top, start_x + card_width, top + card_height)
        draw.rounded_rectangle(rect, radius=24, fill='#ffffff', outline='#d9e1ff', width=2)
        draw.text((start_x + 24, top + 18), title, font=font_medium, fill='#1b3a8a')
        draw.text((start_x + 24, top + 62), body, font=font_body, fill='#4b5676')
        button_rect = (
            start_x + card_width - 260,
            top + card_height - button_height - 16,
            start_x + card_width - 24,
            top + card_height - 16,
        )
        draw.rounded_rectangle(button_rect, radius=16, fill='#2563eb')
        draw.text((button_rect[0] + 20, button_rect[1] + 6), button, font=font_body, fill='#ffffff')

    aside_rect = (640, 220, 1200, 520)
    draw.rounded_rectangle(aside_rect, radius=24, fill='#ffffff', outline='#d9e1ff', width=2)
    draw.text((670, 250), 'Demo Accounts', font=font_medium, fill='#1b3a8a')
    bullet_y = 300
    bullets = [
        'Student — student1 / StudentPass123!',
        'Parent — parent1 / ParentPass123!',
        'Teacher — teacher1 / TeacherPass123!',
        'Admin — admin1 / AdminPass123!',
    ]
    for bullet in bullets:
        draw.text((690, bullet_y), f'• {bullet}', font=font_body, fill='#3d4a6d')
        bullet_y += 40

    footer_rect = (80, 580, 1200, 640)
    draw.rounded_rectangle(footer_rect, radius=24, fill='#ffffff', outline='#d9e1ff', width=2)
    draw.text(
        (110, 604),
        'Need an account? Contact an administrator to create linked profiles.',
        font=font_body,
        fill='#4b5676',
    )

    img.save(BASE_PATH / 'login-page.png')


def draw_student_dashboard_mockup(font_large, font_medium, font_body):
    size = (1280, 720)
    img = Image.new('RGB', size, '#f6f8ff')
    draw = ImageDraw.Draw(img)

    header_rect = (40, 40, 1240, 140)
    draw.rounded_rectangle(header_rect, radius=32, fill='#ffffff', outline='#d0dafc', width=2)
    draw.text((70, 70), 'Good morning, Mia!', font=font_large, fill='#1b3a8a')
    draw.text((70, 120), 'Here is your learning plan for today.', font=font_body, fill='#4b5676')

    focus_rect = (40, 160, 1240, 290)
    draw.rounded_rectangle(focus_rect, radius=28, fill='#ffffff', outline='#d0dafc', width=2)
    draw.text((70, 190), "Today's Focus", font=font_medium, fill='#1b3a8a')
    draw.text(
        (70, 230),
        'English • Story Adventure — complete Station 2',
        font=font_body,
        fill='#4b5676',
    )
    draw.rounded_rectangle((840, 210, 1180, 260), radius=18, fill='#2563eb')
    draw.text((860, 222), 'Resume Lesson', font=font_body, fill='#ffffff')

    schedule_rect = (40, 310, 620, 620)
    draw.rounded_rectangle(schedule_rect, radius=28, fill='#ffffff', outline='#d0dafc', width=2)
    draw.text((70, 340), "Today's Schedule", font=font_medium, fill='#1b3a8a')
    tasks = [
        ('8:00 AM', 'Morning meeting check-in'),
        ('8:30 AM', 'Math • Number Patterns'),
        ('9:15 AM', 'Reading • Word Builders'),
        ('10:00 AM', 'Science • Weather Watch'),
    ]
    y = 380
    for time, desc in tasks:
        draw.text((70, y), time, font=font_body, fill='#2563eb')
        draw.text((200, y), desc, font=font_body, fill='#4b5676')
        y += 48

    progress_rect = (660, 310, 1240, 620)
    draw.rounded_rectangle(progress_rect, radius=28, fill='#ffffff', outline='#d0dafc', width=2)
    draw.text((690, 340), 'My Progress', font=font_medium, fill='#1b3a8a')
    bars = [
        ('Math', 80),
        ('English', 65),
        ('Science', 55),
    ]
    y = 380
    for label, percent in bars:
        draw.text((690, y), label, font=font_body, fill='#4b5676')
        bar_rect = (860, y + 6, 1160, y + 30)
        draw.rounded_rectangle(bar_rect, radius=12, fill='#e0e7ff')
        fill_rect = (860, y + 6, 860 + int((percent / 100) * 300), y + 30)
        draw.rounded_rectangle(fill_rect, radius=12, fill='#2563eb')
        draw.text((1180, y + 2), f'{percent}%', font=font_body, fill='#1b3a8a', anchor='lm')
        y += 60

    quick_links_rect = (40, 640, 1240, 700)
    draw.rounded_rectangle(quick_links_rect, radius=24, fill='#ffffff', outline='#d0dafc', width=2)
    draw.text(
        (70, 654),
        'Quick Links: Counting • Story Adventure • Weather Watch',
        font=font_body,
        fill='#4b5676',
    )

    img.save(BASE_PATH / 'student-dashboard.png')


def main():
    font_large, font_medium, font_body = load_fonts()
    draw_login_mockup(font_large, font_medium, font_body)
    draw_student_dashboard_mockup(font_large, font_medium, font_body)
    print('Mockups generated in', BASE_PATH)


if __name__ == '__main__':
    main()
