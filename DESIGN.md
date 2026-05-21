---
name: DorMsa Design System
colors:
  surface: '#f7fbf0'
  surface-dim: '#d8dbd1'
  surface-bright: '#f7fbf0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f5eb'
  surface-container: '#ecefe5'
  surface-container-high: '#e6e9df'
  surface-container-highest: '#e0e4da'
  on-surface: '#191d17'
  on-surface-variant: '#41493d'
  inverse-surface: '#2d322b'
  inverse-on-surface: '#eff2e8'
  outline: '#717a6c'
  outline-variant: '#c0c9b9'
  surface-tint: '#2b6c23'
  primary: '#286921'
  on-primary: '#ffffff'
  primary-container: '#428337'
  on-primary-container: '#f8fff0'
  inverse-primary: '#92d881'
  secondary: '#426181'
  on-secondary: '#ffffff'
  secondary-container: '#b8d7fd'
  on-secondary-container: '#3f5e7e'
  tertiary: '#953d68'
  on-tertiary: '#ffffff'
  tertiary-container: '#b35581'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#adf59b'
  primary-fixed-dim: '#92d881'
  on-primary-fixed: '#002200'
  on-primary-fixed-variant: '#0e530b'
  secondary-fixed: '#d0e4ff'
  secondary-fixed-dim: '#aac9ef'
  on-secondary-fixed: '#001d35'
  on-secondary-fixed-variant: '#294968'
  tertiary-fixed: '#ffd8e6'
  tertiary-fixed-dim: '#ffb0d0'
  on-tertiary-fixed: '#3d0023'
  on-tertiary-fixed-variant: '#7b2752'
  background: '#f7fbf0'
  on-background: '#191d17'
  surface-variant: '#e0e4da'
typography:
  display-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container_max: 1280px
  gutter: 24px
---

## Brand & Style
This design system bridges the gap between the energetic accessibility required for a student demographic and the high-end reliability of a premium real estate platform. The aesthetic is rooted in **Modern SaaS** principles—utilizing generous whitespace, ultra-rounded corners, and clarity—while layering in **Glassmorphism** to signify a premium, forward-thinking tech stack.

The emotional goal is to provide students and property managers with a sense of security and organized calm during the often-stressful housing search. By combining organic greens with deep, institutional blues, the system communicates both growth and stability.

## Colors
The color strategy employs a high-contrast ratio to ensure WCAG accessibility. 

- **Primary Green (#549648)**: Used for action-oriented elements, success states, and indicating "active" housing listings. It represents growth and the "green light" for students finding a home.
- **Secondary Dark Blue (#042b49)**: Reserved for structural components like navigation and deep hierarchy headings to establish institutional trust.
- **Backgrounds**: A pristine white base is used for primary cards, while a soft, cool gray is used for page backgrounds to allow white "glass" elements to pop.

## Typography
The system uses a dual-font approach to balance personality and utility. 

- **Plus Jakarta Sans** is the display face, chosen for its friendly, modern curves and optimistic geometry. It should be used for all headings to maintain the "Modern Startup" vibe.
- **Inter** is the workhorse for body text and functional UI labels. Its high legibility at small sizes ensures that housing details and lease terms are easy to digest for students.
- **Hierarchy**: Use `secondary` blue for headings and `text_muted` for secondary body information to guide the eye through dense listing data.

## Layout & Spacing
The layout follows a **Fixed-Fluid hybrid grid**. While the main content is constrained to a 1280px container for readability on desktop, internal dashboard elements utilize a flexible 12-column system.

- **Rhythm**: All spacing is derived from an 8px base unit. 
- **Spaciousness**: To maintain a "premium" feel, avoid crowding elements. Use `lg` (48px) spacing between major sections and `md` (24px) for internal card padding. 
- **Margins**: Use wide page margins (at least 24px on mobile, 80px on desktop) to let the interface breathe, echoing the feeling of a spacious home.

## Elevation & Depth
This system uses **Ambient Shadows** and **Glassmorphism** to create a sense of verticality without the heaviness of traditional skeuomorphism.

- **Surface 1 (Base)**: Background Gray (#F8FAFB).
- **Surface 2 (Cards)**: Pure White with a very soft, diffused shadow (Blur: 20px, Y: 4px, Color: rgba(4, 43, 73, 0.05)).
- **Surface 3 (Overlays/Floating)**: Semi-transparent white (rgba(255, 255, 255, 0.7)) with a 12px Backdrop Blur. Use this for navigation bars and sticky filters.
- **Interactions**: On hover, cards should lift slightly (shadow increases in blur) to signal interactivity.

## Shapes
The shape language is defined by **High Roundedness**. This softens the "Corporate" feel of real estate and makes the platform feel more approachable for students.

- **Primary Cards**: Use `xl` (24px) or `2xl` (40px) corner radii for a "pill-like" or "bubble" containers.
- **Buttons & Inputs**: Use `lg` (16px) for a consistent, modern feel that isn't fully circular but avoids sharp edges.
- **Icons**: Icons should be housed in rounded-square or circular containers with soft background tints of the primary green.

## Components
- **Buttons**: Primary buttons are solid `primary_color` with white text and `lg` rounding. Secondary buttons use a transparent background with a `primary_color` border.
- **Housing Cards**: Must feature a large image with `xl` rounding, a floating "Price" badge using glassmorphism in the top-right corner, and `secondary_color` typography for the address.
- **Search Inputs**: Large, white fields with `lg` rounding, a soft shadow, and a `secondary_color` icon. On focus, the border transitions to `primary_color`.
- **Status Chips**: Used for "Available", "Waitlist", or "Verified." These should have a subtle tint of the primary color with bold `label-bold` text.
- **Navigation**: The top navbar uses a glassmorphism effect with a subtle 1px border at the bottom.
- **Lists**: Used for amenities; icons should be `primary_color` followed by `body-md` text.