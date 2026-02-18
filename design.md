# EketSupply Mobile App Design Document

## Design Philosophy

EketSupply mobile app follows **Apple Human Interface Guidelines (HIG)** to feel like a native iOS app while maintaining cross-platform compatibility. The design prioritizes **one-handed usage**, **portrait orientation (9:16)**, and **mainstream iOS mobile app standards**.

---

## Screen List & Layout

### Authentication Screens

#### 1. Welcome/Onboarding (First Launch)
**Content:**
- Hero image or illustration showing artisan-customer connection
- App value propositions (3-4 slides)
- "Get Started" and "Sign In" buttons at bottom

**Layout:**
- Full-screen carousel with page indicators
- Fixed bottom action buttons with safe area padding
- Skip button in top-right corner

#### 2. Sign In
**Content:**
- App logo at top
- Email input field
- Password input field with visibility toggle
- "Forgot Password?" link
- "Sign In" primary button
- "Don't have an account? Sign Up" link at bottom

**Layout:**
- Centered form with generous padding
- Single-column layout
- Keyboard-aware scrolling

#### 3. Sign Up
**Content:**
- Tab selector: "I need help" (Seeker) | "I am a Pro" (Artisan)
- Full name input
- Email input
- Phone number input
- Password input with visibility toggle
- Confirm password input with visibility toggle
- Terms acceptance checkbox
- "Create Account" primary button

**Layout:**
- Tab bar at top
- Form fields with consistent spacing
- Password strength indicator
- Keyboard dismissal on scroll

---

### Home & Discovery Screens

#### 4. Home Screen (Seeker)
**Content:**
- Search bar at top
- Location indicator with change option
- Service category grid (6-8 categories with icons)
- "Featured Artisans" horizontal scroll
- "Recent Activity" list
- Bottom tab bar navigation

**Layout:**
- Sticky search bar
- 2-column grid for categories
- Horizontal scrolling cards for featured artisans
- Vertical list for recent activity

**Functionality:**
- Pull-to-refresh
- Category tap → Category detail screen
- Artisan card tap → Artisan profile
- Search tap → Search screen

#### 5. Search & Filter
**Content:**
- Search input with voice option
- Recent searches
- Filter chips (Location, Rating, Price, Availability)
- Search results list with artisan cards

**Layout:**
- Fixed search bar at top
- Horizontal scrolling filter chips
- Vertical scrolling results
- Empty state for no results

**Functionality:**
- Real-time search
- Filter modal on chip tap
- Sort options (Distance, Rating, Price)

#### 6. Service Category Detail
**Content:**
- Category name and icon
- Description
- Artisan list filtered by category
- Sort and filter options

**Layout:**
- Header with category info
- List view with artisan cards
- Floating filter button

---

### Artisan Profile Screens

#### 7. Artisan Profile
**Content:**
- Profile photo and cover image
- Name, rating, and verification badge
- Bio/description
- Service offerings with prices
- Portfolio gallery (photos of work)
- Reviews section (top 3, "See All" link)
- Contact buttons (Call, WhatsApp, Message)
- "Request Quote" and "Book Now" buttons

**Layout:**
- Scrollable profile with sticky header
- Grid layout for portfolio
- Card-based service offerings
- Fixed bottom action buttons

**Functionality:**
- Gallery tap → Full-screen image viewer
- Review tap → All reviews screen
- Contact buttons → Phone/WhatsApp/Chat
- Action buttons → Quote/Booking modals

#### 8. Portfolio Gallery
**Content:**
- Full-screen image viewer
- Swipe to navigate
- Image counter (e.g., "3 of 12")
- Close button

**Layout:**
- Full-screen images
- Pinch-to-zoom
- Swipe gestures

#### 9. Reviews & Ratings
**Content:**
- Overall rating summary
- Rating distribution chart
- Individual reviews with:
  - Reviewer name and photo
  - Star rating
  - Review text
  - Photos (if any)
  - Date
- Sort options (Recent, Highest, Lowest)

**Layout:**
- Header with summary stats
- Vertical scrolling list
- Photo grid in reviews

---

### Booking & Payment Screens

#### 10. Request Quote Modal
**Content:**
- Service selection
- Project description textarea
- Preferred date picker
- Budget range slider
- Contact info (pre-filled)
- "Submit Request" button

**Layout:**
- Bottom sheet modal (70% screen height)
- Form fields with validation
- Dismissible with swipe down

#### 11. Instant Booking Flow
**Content:**
- Service selection
- Date and time picker
- Location/address input
- Special instructions textarea
- Price breakdown
- Payment method selection
- "Confirm Booking" button

**Layout:**
- Multi-step wizard (progress indicator)
- Step 1: Service details
- Step 2: Date & time
- Step 3: Location
- Step 4: Payment
- Step 5: Confirmation

#### 12. Payment Screen
**Content:**
- Service summary
- Price breakdown (Service fee, Platform fee, Total)
- Payment method selector (Card, Bank transfer, Wallet)
- Escrow explanation
- "Pay Now" button

**Layout:**
- Summary card at top
- Payment options as radio buttons
- Info banner explaining escrow
- Fixed bottom button

#### 13. Booking Confirmation
**Content:**
- Success icon/animation
- Booking reference number
- Service details summary
- Artisan contact info
- "View Booking" and "Go Home" buttons

**Layout:**
- Centered success message
- Card with booking details
- Action buttons at bottom

---

### Dashboard Screens

#### 14. My Bookings (Seeker)
**Content:**
- Tab selector: Active | Completed | Cancelled
- Booking cards with:
  - Service name
  - Artisan name and photo
  - Date and time
  - Status badge
  - Action buttons (View, Message, Cancel)

**Layout:**
- Tab bar at top
- Vertical scrolling list
- Swipe actions (Cancel, Reschedule)

#### 15. Booking Detail
**Content:**
- Status timeline
- Service details
- Artisan info
- Date, time, location
- Payment status
- Chat button
- Action buttons (Cancel, Reschedule, Complete, Review)

**Layout:**
- Scrollable detail view
- Timeline visualization
- Fixed bottom action buttons

#### 16. Artisan Dashboard (Pro)
**Content:**
- Earnings summary card
- Pending quote requests (count badge)
- Active jobs list
- Quick actions (Update availability, View earnings)
- Performance metrics (Rating, Completion rate)

**Layout:**
- Summary cards at top
- List of requests/jobs
- Bottom tab bar

#### 17. Earnings & Payouts (Pro)
**Content:**
- Total earnings
- Available balance
- Pending balance (in escrow)
- Transaction history
- "Request Payout" button
- Payout method setup

**Layout:**
- Balance cards at top
- Transaction list below
- Filter by date range

---

### Messaging Screens

#### 18. Chat List
**Content:**
- List of conversations
- Each item shows:
  - Contact photo and name
  - Last message preview
  - Timestamp
  - Unread badge

**Layout:**
- Vertical scrolling list
- Swipe to delete
- Search bar at top

#### 19. Chat Detail
**Content:**
- Message bubbles (sent/received)
- Text input with send button
- Attachment button (photos)
- Typing indicator
- Message timestamps

**Layout:**
- Scrollable message list
- Fixed input bar at bottom
- Keyboard-aware layout

---

### Settings & Profile Screens

#### 20. Profile Settings
**Content:**
- Profile photo (editable)
- Name, email, phone
- Edit button for each field
- "Change Password" option
- "Notification Preferences"
- "Privacy Settings"
- "Help & Support"
- "Log Out" button

**Layout:**
- Grouped list style
- Section headers
- Disclosure indicators

#### 21. Edit Profile
**Content:**
- Form fields for editable info
- Photo upload
- Save button

**Layout:**
- Form with validation
- Keyboard-aware scrolling

#### 22. Notification Preferences
**Content:**
- Toggle switches for:
  - Booking updates
  - Messages
  - Payment notifications
  - Marketing emails
  - Push notifications

**Layout:**
- Grouped list with toggles
- Section descriptions

---

## Key User Flows

### Flow 1: Seeker Books an Artisan
1. User opens app → Home screen
2. Taps service category → Category detail screen
3. Browses artisans → Taps artisan card → Artisan profile
4. Reviews portfolio and ratings
5. Taps "Book Now" → Instant booking modal
6. Fills in date, time, location
7. Selects payment method → Payment screen
8. Confirms payment → Booking confirmation
9. Receives confirmation notification

### Flow 2: Artisan Receives and Accepts Quote Request
1. Artisan receives push notification
2. Opens app → Artisan dashboard
3. Taps "Quote Requests" → List of requests
4. Taps request → Request detail
5. Reviews project description
6. Taps "Send Quote" → Quote form
7. Enters price and details
8. Submits quote
9. Seeker receives notification

### Flow 3: Seeker Completes Job and Leaves Review
1. Job is marked complete by artisan
2. Seeker receives notification
3. Opens app → Booking detail
4. Taps "Release Payment" → Confirmation modal
5. Confirms payment release
6. Taps "Leave Review" → Review form
7. Selects star rating
8. Writes review text
9. Uploads photos (optional)
10. Submits review
11. Review appears on artisan profile

### Flow 4: Dispute Resolution
1. User taps "Report Issue" on booking
2. Selects dispute type
3. Writes description
4. Uploads evidence (photos, screenshots)
5. Submits dispute
6. Admin reviews in admin dashboard
7. Admin takes action (refund/release)
8. Both parties receive notification
9. Dispute status updated

---

## Color Scheme

### Primary Colors
- **Primary (Brand):** `#0a7ea4` (Teal blue - trust, professionalism)
- **Accent:** `#FF6B35` (Orange - action, energy)

### Semantic Colors
- **Success:** `#22C55E` (Green - completed, verified)
- **Warning:** `#F59E0B` (Amber - pending, attention)
- **Error:** `#EF4444` (Red - cancelled, issues)
- **Info:** `#3B82F6` (Blue - information)

### Neutral Colors
- **Background (Light):** `#FFFFFF`
- **Background (Dark):** `#151718`
- **Surface (Light):** `#F5F5F5`
- **Surface (Dark):** `#1E2022`
- **Foreground (Light):** `#11181C`
- **Foreground (Dark):** `#ECEDEE`
- **Muted (Light):** `#687076`
- **Muted (Dark):** `#9BA1A6`
- **Border (Light):** `#E5E7EB`
- **Border (Dark):** `#334155`

---

## Typography

### Font Family
- **Primary:** SF Pro (iOS), Roboto (Android)
- **Monospace:** SF Mono (for numbers, codes)

### Text Styles
- **Heading 1:** 32px, Bold
- **Heading 2:** 24px, Semibold
- **Heading 3:** 20px, Semibold
- **Body:** 16px, Regular
- **Body Small:** 14px, Regular
- **Caption:** 12px, Regular
- **Button:** 16px, Semibold

---

## Component Patterns

### Buttons
- **Primary:** Filled with primary color, white text, rounded corners (12px)
- **Secondary:** Outlined with border, primary color text
- **Tertiary:** Text only, no background
- **Sizes:** Small (36px), Medium (44px), Large (52px)

### Cards
- **Artisan Card:** Photo, name, rating, service, price, location
- **Booking Card:** Service icon, title, status badge, date, action button
- **Review Card:** User photo, name, rating stars, text, date

### Input Fields
- **Text Input:** Rounded corners (8px), border, label above
- **Search Bar:** Pill-shaped, icon inside, placeholder text
- **Textarea:** Multi-line, auto-expanding

### Navigation
- **Tab Bar:** 4-5 tabs, icons + labels, active state indicator
- **Top Bar:** Title centered, back button left, action button right
- **Bottom Sheet:** Swipeable modal, rounded top corners

---

## Interaction Patterns

### Gestures
- **Tap:** Primary action (open, select)
- **Long Press:** Context menu (delete, edit)
- **Swipe Left/Right:** Navigate, dismiss
- **Swipe Down:** Dismiss modal, refresh
- **Pinch:** Zoom images

### Feedback
- **Haptic:** Light tap on button press, medium on toggle, success/error on completion
- **Visual:** Opacity change on press (0.7), scale animation (0.97)
- **Loading:** Spinner for async actions, skeleton for content loading

### Animations
- **Duration:** 250-300ms for most transitions
- **Easing:** Ease-in-out for natural feel
- **Page Transitions:** Slide from right (iOS), fade (Android)

---

## Accessibility

### Requirements
- **Minimum Touch Target:** 44x44px
- **Color Contrast:** WCAG AA compliant (4.5:1 for text)
- **Font Scaling:** Support Dynamic Type (iOS) and font scaling (Android)
- **Screen Reader:** All interactive elements labeled
- **Keyboard Navigation:** Support for external keyboards

---

## Platform-Specific Considerations

### iOS
- **Navigation:** Swipe from left edge to go back
- **Modals:** Present from bottom, swipe down to dismiss
- **Action Sheets:** Bottom-aligned, blur background
- **Alerts:** Center-aligned, two-button layout

### Android
- **Navigation:** Hardware back button support
- **Modals:** Fade in, tap outside to dismiss
- **Snackbars:** Bottom toast notifications
- **Material Design:** Ripple effects on touch

---

## Performance Targets

- **App Launch:** < 2 seconds
- **Screen Transitions:** < 300ms
- **Image Loading:** Progressive with placeholders
- **List Scrolling:** 60 FPS
- **API Response:** < 1 second with loading states

---

## Next Steps

1. Generate custom app logo (square, iconic, fills entire space)
2. Update app.config.ts with branding
3. Implement authentication screens
4. Build home screen with service categories
5. Create artisan profile template
6. Implement booking flow
7. Add payment integration
8. Build messaging system
9. Create dashboards
10. Polish and test

---

**Design Status:** ✅ Complete and ready for implementation
