# API Documentation

## Authentication (`/api/auth`)

| Method | Endpoint | Description | Body Params |
| :--- | :--- | :--- | :--- |
| POST | `/register` | Register a new user | `name`, `email`, `password`, `role` |
| POST | `/login` | Authenticate user | `email`, `password` |

## Events (`/api/events`)

| Method | Endpoint | Description | Access | Body Params |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/` | Get all approved events | Public | - |
| POST | `/` | Create a new event | Organizer | `title`, `description`, `date`, `startTime`, `location` |
| GET | `/:id` | Get single event details | Public | - |
| PUT | `/:id/approve` | Approve a pending event | Admin | - |
| POST | `/:id/rsvp` | Toggle RSVP status | Student | - |
| PUT | `/:id` | Update (Complete/Gallery) | Organizer | `status`, `galleryImages` |
| POST | `/:id/feedback` | Submit Rating | Student | `rating`, `comment` |

## Verification (`/api/events`)

| Method | Endpoint | Description | Access | Body Params |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/scan` | Verify Check-in | Organizer | `eventId`, `userId` |
