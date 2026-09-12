# SAIL Connect

BUILD A PROFESSIONAL EMPLOYEE KNOWLEDGE MANAGEMENT MOBILE APP

I want you to help me build a complete professional mobile application for SAIL – Salem Steel Plant.

The project name is:

SAIL EMPLOYEE KNOWLEDGE MANAGEMENT SYSTEM

This is a real company-style employee application for approximately 600+ employees.

I want a polished, simple, professional and easy-to-use UI/UX because the employees include both older employees around 55+ years old and younger employees.

The application must therefore have:

Large readable text

Clear buttons

Simple navigation

High contrast

Professional corporate design

Minimal unnecessary complexity

Smooth animations

Fast loading

Proper error messages

Easy navigation for older employees

SAIL branding throughout the application

1. IMPORTANT CHANGE FROM THE PREVIOUS DESIGN

DO NOT make employees create their own employee profile.

The company already has employee information.

The company will provide a database containing employee information.

Each employee will already have:

Employee Number

Name

Department

Designation

Phone

Email

Date of Birth

Joining Date

Employee Type

Qualification

Address

Other required employee information

The employee should only enter:

Employee Number

and

Password

to log in.

After login, the application should automatically retrieve the employee's information from the database using the Employee Number / authenticated account.

DO NOT ask the employee to manually enter their name, department, address, DOB, designation, etc.

2. TECHNOLOGY

Build the application using:

Flutter + Dart

Backend:

Firebase

Use:

Firebase Authentication

Cloud Firestore

Firebase Storage

Firebase Cloud Functions where necessary

Firebase Cloud Messaging for push notifications

The architecture must be scalable for at least 600+ employees.

Use clean architecture and organize the project properly.

Suggested structure:

lib/
core/
models/
services/
providers/
screens/
widgets/
localization/
admin/
employee/
utils/

Do not put everything inside main.dart.

3. EMPLOYEE LOGIN

Create a very simple login screen.

The screen should contain:

SAIL LOGO

SAIL / SALEM STEEL PLANT

"EMPLOYEE KNOWLEDGE MANAGEMENT SYSTEM"

Employee Number field

Password field

LOGIN button

Forgot Password option

Language selector:

English
தமிழ்
हिन्दी

The employee should NOT need to enter email.

Login should work using the employee number and password.

The backend should map the employee number to the authenticated Firebase account securely.

Do NOT store passwords in Firestore as plain text.

4. FIRST LOGIN

If an employee is logging in for the first time:

Show a simple welcome screen:

"Welcome to SAIL Knowledge Hub"

Then show:

Employee Name

Employee Number

Department

Designation

and a short introduction to the application.

If required, ask the employee to change their temporary password.

After that, take them to the Home screen.

5. EMPLOYEE HOME PAGE

The Home page is the main page.

It should contain:

SAIL logo

"Good Morning / Good Afternoon / Good Evening"

Employee name

Department

Profile icon

Notification icon

Large search bar

Quick access cards

Today's learning

Today's announcement

Upcoming events

Important circulars

Birthday / work anniversary notifications

The home page should be visually attractive but not overcrowded.

6. SEARCH

Add a search bar on the Home page.

Employees should be able to search across:

Knowledge articles

Videos

Documents

Circulars

Events

Company information

Learning content

Search results should be easy to read.

Use large text and clear categories.

7. PAGE 1 — HOME

Home should contain:

Employee greeting

Search

Quick Access

Today's Learning Video

Today's Quiz

Today's Quote / Motivation

Latest Announcement

Upcoming Event

Important Circular

Birthday / Work Anniversary information

8. PAGE 2 — KNOWLEDGE HUB

Create a dedicated:

KNOWLEDGE HUB

This is the main learning section.

It should contain:

Daily Video

Every day the employee should see a company-related learning video.

Examples:

SAIL company knowledge

Salem Steel Plant information

Safety procedures

Production processes

Workplace safety

Quality

Maintenance

HR policies

Employee awareness

Technical training

General knowledge about the plant

The admin should be able to upload/add videos.

The admin should be able to specify:

Video title

Description

Thumbnail

Video URL / uploaded video

Date

Department/category

The appropriate daily video should automatically appear.

9. DAILY QUIZ

The Knowledge Hub should contain a:

DAILY QUIZ

Every day show approximately 10 questions.

Questions can be about:

Company

Safety

Plant

Technical knowledge

HR

Policies

General employee awareness

Show:

Question

4 options

Submit Answer

Score

Correct answers

Progress:

Question 1 / 10

At the end show:

"Your Score: 8/10"

The admin should be able to create, edit and delete quiz questions.

The admin should be able to schedule questions for specific dates.

10. DAILY MOTIVATION

Show one motivational message / quote each day.

Example:

"Safety is everyone's responsibility."

The admin should be able to create and manage these quotes.

11. PAGE 3 — AI ASSISTANT

Create:

SAIL AI ASSISTANT

Employees can chat with the AI.

The AI should answer normal questions and employee-related knowledge questions.

Examples:

"Explain what this safety procedure means."

"What is today's learning topic?"

"What is the meaning of this company policy?"

"Tell me about today's event."

The AI should have a professional assistant interface.

Chat bubbles

Typing animation

Loading animation

Clear chat button

Suggested questions

The AI should NOT invent confidential company information.

For company-specific information, it should preferably use approved company knowledge/content.

Also show a small disclaimer:

"AI-generated responses may not always be accurate. Verify important company information with the appropriate department."

12. COMPANY NEWS

The AI / Home section can also show approved company news.

However, company news must come from the company's approved content/admin system.

The admin should be able to publish:

Company news

Announcements

Achievements

Important updates

Do not allow the AI to invent company news.

13. PAGE 4 — EVENTS

Create:

EVENTS

Show company events such as:

Sports

Cultural events

Training programs

Meetings

Celebrations

Competitions

Employee activities

Safety programs

Awareness programs

Other plant events

Each event should contain:

Event image

Event title

Date

Time

Location

Description

Event status

14. EVENT GALLERY

Every event can have a gallery.

For example:

SPORTS DAY 2026

[Images]

Employees should be able to view event photographs.

Admin should be able to:

Create event

Edit event

Delete event

Upload images

Upload multiple images

Add description

Set event date

Use Firebase Storage for images.

15. PAGE 5 — CIRCULARS

Create:

CIRCULARS & INFORMATION

This section should contain official company information.

Examples:

HR circulars

Safety circulars

Holiday information

Employee notices

Company policies

Important instructions

Department notices

General announcements

Each circular should contain:

Title

Date

Category

Description

Attachment if available

PDF/document viewer if required

Employees should be able to search circulars.

Admin can:

Create
Edit
Delete
Publish
Unpublish

16. PAGE 6 — PROFILE

Create a professional:

MY PROFILE

Show automatically retrieved employee information:

Profile photo

Full Name

Employee Number

Department

Designation

Employee Type

Email

Phone

Date of Birth

Joining Date

Qualification

Experience

Address

Other approved information

Employees should NOT directly modify important company-controlled information.

Provide:

Change Password

Language

Notification Settings

Logout

App Version

Privacy / Terms

17. ADMIN LOGIN

There must be a separate:

ADMIN LOGIN

The admin area must NOT be accessible to normal employees.

Use proper Firebase authentication and role-based access.

Use an admin role / custom claims or another secure server-side authorization method.

DO NOT simply hide an admin button and assume that is security.

18. ADMIN DASHBOARD

Admin should have complete control over the application.

Dashboard should show:

Total Employees

Active Employees

Inactive Employees

New Accounts

Total Videos

Total Quizzes

Upcoming Events

Circulars

Notifications

Recent Activity

19. ADMIN EMPLOYEE MANAGEMENT

Admin can:

Add employee

Remove employee

Edit employee

Disable employee

Enable employee

Search employee

View employee profile

Change/reset password

Update department

Update designation

Update employee information

Admin should be able to import employee data from CSV/Excel if practical.

Design the system so that the existing company employee database can be imported.

20. NEW ACCOUNT NOTIFICATION

When an employee account is created:

Admin should receive a notification/activity entry.

Example:

"New employee account created"

Show:

Employee name

Employee number

Department

Date/time

21. EMPLOYEE DELETION

If an employee account is deleted/disabled:

Record the action securely in an admin audit log.

Do not permanently destroy important records without proper confirmation.

Show confirmation before deletion.

Example:

"Are you sure you want to disable this employee account?"

22. ADMIN CONTENT MANAGEMENT

Admin must control all content.

Create sections:

Employees

Videos

Quizzes

Quotes

Events

Gallery

Circulars

News

Notifications

AI Knowledge

Settings

Admin users

Audit Logs

23. VIDEO MANAGEMENT

Admin can:

Upload video

Add YouTube/video URL if appropriate

Set title

Description

Category

Publish date

Expiry date

Thumbnail

Publish/unpublish

Delete

24. QUIZ MANAGEMENT

Admin can:

Create quiz

Add 10 or more questions

Add 4 options

Select correct answer

Add explanation

Schedule quiz date

Edit quiz

Delete quiz

View employee quiz scores

25. EVENT MANAGEMENT

Admin can:

Create event

Add title

Date

Time

Location

Description

Images

Gallery

Edit

Delete

Publish

26. CIRCULAR MANAGEMENT

Admin can:

Create circular

Upload PDF

Add title

Add category

Set date

Publish

Edit

Delete

27. NOTIFICATION SYSTEM

This is VERY IMPORTANT.

The application should automatically send notifications.

Do NOT require the administrator to manually send birthday notifications every day.

The system should automatically check employee data.

For example:

If employee DOB is today:

"🎂 Happy Birthday, [Employee Name]!"

This notification should be sent to employees according to the company's desired notification policy.

Also automatically detect work anniversaries.

Example:

"🎉 Congratulations [Employee Name] on completing 5 years with SAIL!"

The system should calculate years automatically from:

joiningDate

Examples:

1 year

2 years

5 years

10 years

25 years

etc.

Use scheduled backend/cloud functions for this.

Do NOT run the birthday checking only when someone opens the app.

28. OTHER AUTOMATIC NOTIFICATIONS

The system should support notifications for:

Birthday

Work anniversary

New video

New quiz

New event

New circular

Company announcement

Important safety information

Admin announcements

The employee should be able to control non-critical notification preferences.

Critical company notifications should not be easily disabled if company policy requires them.

29. 3 LANGUAGES

The application must support:

English — Default

Tamil — தமிழ்

Hindi — हिन्दी

Language selector should be available in:

Login

Profile/Settings

The UI should dynamically change language.

Do not simply translate only the login page.

All standard UI labels should support localization.

Admin-created content may remain in the language in which the admin entered it unless multilingual content is specifically provided.

Use Flutter localization properly.

30. SAIL BRANDING

Use the official SAIL logo throughout the application.

The logo should appear on:

Login

Splash screen

Home

Important screens

Admin dashboard

Where visually appropriate

Do not stretch or distort the logo.

Keep the branding professional.

Use a corporate design inspired by the steel/industrial environment.

Do not make the UI childish.

31. UI/UX DESIGN

This is extremely important.

The application should look like a professional corporate application.

Use:

Modern cards

Rounded corners

Clean spacing

Large readable typography

Clear icons

Professional blue/steel-inspired color palette

Subtle gradients

Proper shadows

Good contrast

Large touch targets

Consistent buttons

Consistent icons

Smooth page transitions

Loading animations

Skeleton loading where useful

Empty-state screens

Error-state screens

Success animations

Pull-to-refresh where appropriate

Do NOT overuse animations.

Animations must feel professional.

32. ACCESSIBILITY

Because many employees may be older:

Use:

Minimum readable font sizes

Large buttons

High contrast

Clear labels

Simple language

Large icons

Avoid tiny text

Avoid crowded screens

Avoid complicated gestures

Avoid excessive animations

Make important actions obvious

The application must work comfortably for a 55+ employee.

33. HOME PAGE NAVIGATION

Use a simple bottom navigation:

HOME

KNOWLEDGE

AI

EVENTS

CIRCULARS

PROFILE

Notifications can be available through a notification icon on Home.

Do not create too many navigation levels.

34. NOTIFICATIONS SCREEN

Create a notification center.

Categories:

Birthday

Work Anniversary

Learning

Quiz

Events

Circulars

Company News

Important

Unread notifications should be visually different.

Provide:

Mark as read

Mark all as read

Clear old notifications if appropriate

35. EMPLOYEE DATA

I already have employee data for the approximately 600 employees.

Do NOT create fake employee information as the final implementation.

Create a proper employee model and database structure so I can import my real employee data.

Expected fields may include:

employeeNumber

fullName

department

designation

email

phone

dateOfBirth

joiningDate

employeeType

qualification

experience

address

city

state

pincode

gender

bloodGroup

profileImage

status

createdAt

updatedAt

Only store sensitive employee information that is actually required by the application.

36. SECURITY

This is a company employee application.

Security is extremely important.

DO NOT:

Store passwords in Firestore

Hardcode admin passwords in Flutter

Put Firebase Admin credentials inside the Flutter app

Trust client-side admin checks

Allow employees to edit other employees

Expose all employee information to every user

Use:

Firebase Authentication

Firestore Security Rules

Firebase Storage Security Rules

Admin SDK / secure backend functions where required

Role-based access

Audit logs

37. ADMIN PASSWORD RESET

Normal employees should have:

Forgot Password

For admin-controlled employee password resets, use a secure backend/Admin SDK mechanism.

Never place Firebase Admin credentials in the mobile application.

38. DATABASE STRUCTURE

Design a scalable Firestore structure.

Suggested collections:

employees

admins

videos

quizzes

quiz_results

events

event_gallery

circulars

news

quotes

notifications

birthday_wishes

app_settings

audit_logs

ai_knowledge

Use appropriate document IDs and indexes.

39. AUTOMATIC DAILY CONTENT

The system should support scheduled content.

For example:

Every day:

Daily Video

Daily Quiz

Daily Quote

The admin can prepare content in advance.

The application automatically displays the content for the current date.

40. AUTOMATIC BIRTHDAY SYSTEM

Create a backend scheduled function that runs daily.

It should:

Get today's date

Check employees collection

Compare month/day with DOB

Find birthdays

Create/send notifications

Avoid duplicate notifications

Do NOT manually create birthday notifications.

41. AUTOMATIC WORK ANNIVERSARY SYSTEM

Create a backend scheduled function.

It should:

Get today's date

Check employee joining dates

Calculate completed years

Find employees whose anniversary is today

Create/send notifications

Avoid duplicates

Example:

"🎉 Congratulations Arun! Today marks your 10th work anniversary with SAIL."

42. PERFORMANCE

There may be 600+ employees.

Do not download the entire employee database unnecessarily on every screen.

Use:

Pagination

Queries

Indexes

Caching where appropriate

Efficient Firestore reads

Lazy loading

Image compression

Pagination for events/gallery/circulars

43. ERROR HANDLING

Every important operation must have proper error handling.

Examples:

Wrong employee number/password

No internet

Firebase unavailable

Content unavailable

Notification failure

Image upload failure

Document upload failure

Show friendly messages.

Never show confusing technical errors to employees.

44. OFFLINE / NETWORK

If possible, use Firebase's offline capabilities and local caching for appropriate non-sensitive content.

If there is no internet:

Show:

"No internet connection. Some information may not be available."

Do not crash the application.

45. SPLASH SCREEN

Create a professional splash screen.

Show:

SAIL LOGO

SALEM STEEL PLANT

KNOWLEDGE MANAGEMENT SYSTEM

Use a short professional animation.

Then automatically navigate to Login or Home depending on authentication state.

46. LOGIN STATE

If the employee is already logged in:

Do not show the login screen every time.

Open Home automatically.

If logged out:

Show Login.

47. ADMIN AND EMPLOYEE SEPARATION

There should be two different experiences:

EMPLOYEE APP

and

ADMIN PANEL

Employee:

Home
Knowledge
AI
Events
Circulars
Profile

Admin:

Dashboard
Employees
Content
Videos
Quizzes
Events
Circulars
News
Notifications
Analytics
Settings
Audit Logs

48. ADMIN ANALYTICS

Add useful analytics such as:

Number of active employees

Daily active users

Video views

Quiz participation

Average quiz score

Most viewed content

Event views

Circular views

Notification delivery

Do not expose unnecessary employee personal data.

49. SEARCH FOR ADMIN

Admin should be able to search:

Employee Number

Name

Department

Designation

Content

Events

Circulars

Videos

50. PROFESSIONAL ANIMATIONS

Add subtle animations such as:

Splash logo animation

Page fade/slide transitions

Card entrance animation

Button feedback

Loading animation

Quiz answer animation

Success animation

Notification animation

Do not make animations slow or distracting.

51. DO NOT OVERCOMPLICATE THE EMPLOYEE EXPERIENCE

The employee should be able to:

Login → Home → Learn / Chat / Events / Circulars / Profile

with very few taps.

The application should feel simple enough for a first-time smartphone user.

52. IMPORTANT IMPLEMENTATION RULE

Do not generate only a UI prototype.

Build the application architecture so it can actually connect to Firebase.

If some external service such as an AI API requires an API key, NEVER hardcode the secret key inside the Flutter application.

Use a secure backend/server-side function.

53. DEVELOPMENT PROCESS

Do not dump hundreds of files at once and leave broken code.

Build the application systematically.

First create:

Project structure

Theme

Localization

Firebase configuration

Authentication

Employee model

Employee login

Home

Navigation

Knowledge Hub

AI Assistant

Events

Circulars

Profile

Notifications

Admin authentication

Admin dashboard

Employee management

Content management

Automated notifications

Security rules

Testing

After each major stage:

Check compilation

Fix errors

Explain what was changed

Then move to the next stage

54. VERY IMPORTANT — TEACH ME STEP BY STEP

I am a beginner in Flutter.

Therefore do NOT simply give me a huge amount of code and expect me to understand everything.

When we start implementation:

Tell me exactly:

STEP 1

What to open

What folder to create

What file to create

What code to paste

Where to paste it

How to save

What terminal command to run

What result I should see

Then wait for me to say:

"NEXT"

Only then give me the next step.

If an error occurs, stop and fix the error before continuing.

55. FINAL GOAL

The final application should look like a real professional corporate employee application for:

SAIL – Salem Steel Plant

with:

Employee login

Employee database

Automatic employee profiles

Home

Knowledge Hub

Daily video

Daily 10-question quiz

Daily motivation

AI Assistant

Company news

Events

Event galleries

Circulars

HR information

Profile

Notifications

Automatic birthdays

Automatic work anniversaries

Three languages:

English

Tamil

Hindi

Admin dashboard

Employee management

Content management

Video management

Quiz management

Event management

Circular management

Notification management

Analytics

Audit logs

Secure authentication

Role-based authorization

Firebase backend

Professional UI/UX

Large readable text

Professional animations

SAIL branding

Scalable architecture for 600+ employees.

Do not build the old employee self-registration system.

Start with the new architecture and guide me step-by-step.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sail-steelhub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/70289993-40f6-4a2c-9ace-0cfb4fde1d4d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Free local AI for the submission

The project now defaults to a local [Ollama](https://ollama.com/) assistant, so it has no per-message API charge. Install Ollama on the computer that runs the app, then run:

```sh
ollama pull llama3.2:3b
```

Keep Ollama running while you demonstrate the project, then start the app with `npm run dev`. The AI assistant and the admin lesson-draft feature will use the local model. This is free to run but it is not a hosted service: the computer running Ollama must stay on. For a permanently hosted AI, set `AI_PROVIDER=openai` and use an API account with available credit.
