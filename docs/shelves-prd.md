# 📘 **Product Requirements Document (PRD)**

## **Feature: User Shelves Page (`/shelves`)**

### Bookmarkd — V1 Implementation

---

## **1. Overview**

The **Shelves** page is the hub for users to view, manage, and organize their personal reading lists.
Each user can track books they:

* **Want to Read**
* **Currently Reading**
* **Read**
* *(Future)* **Dropped**, **Favorites**, or custom shelves

This page centralizes all personal library interactions and becomes one of the most visited destinations in the app.

---

## **2. Goals**

### **Primary Goals**

* Provide users with a clean, intuitive interface to browse books across their reading states.
* Allow easy book state changes (“Move to Currently Reading”, “Mark as Read”, etc).
* Enable quick access to book details.
* Offer a simple overview of reading progress and recent updates.

### **Secondary Goals**

* Encourage more engagement by surfacing books they forgot about.
* Provide visual consistency with the Genre, Book Detail, and Home pages.
* Prepare for future personalized features (AI-powered recommendations, progress graphs, reading streaks, etc).

---

## **3. Key User Stories**

### **Core User Stories**

1. **As a user, I want to see all books in each of my reading shelves**, so that I can track my reading status.
2. **As a user, I want to move a book to another state**, so that my shelves stay up-to-date.
3. **As a user, I want to quickly view book details**, so I can check descriptions, authors, and metadata.
4. **As a user, I want to sort or filter books within a shelf**, so I can find what I'm looking for.
5. **As a user, I want to see reading progress for “Currently Reading” items**, so I know how far along I am.

### **Bonus / Future Stories**

1. **As a user, I want notes and highlights surfaced on this page**, so my reading becomes more meaningful.
2. **As a user, I want reading statistics**, like total books read this year.
3. **As a user, I want AI recommendations**, based on what's in my shelves.

---

## **4. Page Structure & UX Requirements**

## **4.1 High-Level Layout**

```
┌───────────────────────────────────────────────────────┐
│  Header: “Your Shelves”                               │
│  Subtext: “Track what you're reading and what's next” │
├───────────────────────────────────────────────────────┤
│  Tab Bar:                                             │
│  [ Want to Read ] [ Currently Reading ] [ Read ]      │
│    • Tab count badges                                 │
│    • Maybe color-coded per state                      │
├───────────────────────────────────────────────────────┤
│  Shelf Content Area                                   │
│   • Book Cover Grid OR List Layout Toggle             │
│   • Sort Menu: Title | Date Added | Author            │
│   • Optional Progress Bars (Currently Reading)        │
│   • “Move to…” dropdown on each book card             │
└───────────────────────────────────────────────────────┘
```

---

# **5. Detailed Requirements**

## **5.1 Tabs & Navigation**

Tabs represent book status:

* **Want to Read**
* **Currently Reading**
* **Read**

### Required Features:

* Show count badges: `Want to Read (12)`
* URL sync via query param:

    * `/shelves?tab=want`
    * `/shelves?tab=current`
    * `/shelves?tab=read`

### Optional:

* Keyboard-navigation support
* Animated underline for currently active tab

---

## **5.2 Shelf Content — Grid of Book Cards**

Each book card should include:

* Book cover
* Title (line-clamped)
* Authors
* Status badge (or implied by the tab)
* “Move to Shelf” button (dropdown)
* (If reading) progress bar (optional after v1)

Book card layout should match **Home** & **Genre** pages for consistency.

### Sorting Controls

Default: **Date Added (desc)**
Others:

* Title (A→Z, Z→A)
* Author
* Recently Updated

---

## **5.3 “Move to…” Action**

Each book should have a shelf move button:

**Move to…**

* Want to Read
* Currently Reading
* Read
* Remove from Shelves

(Others in future: “Favorites”, “Abandoned”, “Own it”, etc.)

Moving should:

* update the DB via the `/user-books/update` endpoint
* optimistically update the UI
* show toast feedback

---

## **5.4 Empty State UX**

For each shelf, if the user has no books:

```
📚 Your Want to Read list is empty  
Add books you discover to keep track of what you'd like to read later.
[ Browse Books ]
```

Friendly, warm copies.

---

## **5.5 Reading Progress (Optional, Phase 2)**

In `/user-books`, we can include:

* currentPage
* totalPages

Then show:

* small progress bar
* page numbers: “Page 134 of 501”

This is **optional v1**, since your schema may not support it yet.

---

## **6. Data Requirements**

### Minimal API endpoints needed:

1. `GET /user-books?status=WantToRead`
2. `GET /user-books?status=CurrentlyReading`
3. `GET /user-books?status=Read`
4. `PUT /user-books/update` (changing shelf)
5. *(optional)* Sort query options: `sort=title|dateAdded|author`

### DB Requirements

You already have:

```
userBook {
  id
  userId
  bookId
  bookStatus  // "WantToRead", "CurrentlyReading", "Read"
}
```

Optional future fields:

* currentPage
* progressPercent
* dateAdded
* dateCompleted

---

## **7. Visual Design Guidelines**

* Layout should match the **Genres** and **Book Detail** pages.
* One consistent card size across the app.
* Use your Neobrutalism-inspired gradient buttons sparingly.
* Tabs should feel solid, accessible, and mobile-friendly.
* Spacing should follow the same rhythm as Home and Genre pages.

---

## **8. Non-Functional Requirements**

### Performance

* Lazy-load book cover images.
* Paginate if shelf exceeds 50 books.
* Avoid re-fetching shelf data unnecessarily.

### Accessibility

* All interactive elements should be keyboard navigable.
* Adequate contrast for status and sorting chips.
* Tab + arrow key support for the tab bar.

### Scalability

* Future shelves can be added without large rewrites.
* Components reusable for mobile app.

---

## **9. Analytics / Future Enhancements (Phase 2 & 3)**

* Track how many books are moved between shelves.
* Track when users mark a book “Read”.
* Provide AI-based "Next book suggestions".
* Support custom shelves (“Favorites”, “For Later”).
* Add Reading Stats page.

---

# **10. Acceptance Criteria (Dev-Ready)**

* [ ] /shelves route renders correctly with logged-in user context
* [ ] Tabs display correct counts and load correct shelf data
* [ ] Books appear in responsive grid layout
* [ ] “Move to…” menu updates book shelf status
* [ ] Empty states are implemented
* [ ] Sorting menu works per-spec
* [ ] Works on desktop + mobile layouts
* [ ] No layout shift between tabs
* [ ] Fully accessible (keyboard + screen reader naming)
* [ ] Error & loading states implemented