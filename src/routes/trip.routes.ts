import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { createTripSchema, listTripsSchema } from '../schemas/trip.schema';
import {
  getTrips,
  createTrip,
  getTrip,
  bookTrip,
  cancelBooking,
  acceptBooking,
  rejectBooking,
} from '../controllers/trip.controller';

const router = Router();

router.get('/', validate(listTripsSchema), asyncHandler(getTrips));
router.post('/', authenticate, validate(createTripSchema), asyncHandler(createTrip));
router.get('/:id', asyncHandler(getTrip));
router.post('/:id/book', authenticate, asyncHandler(bookTrip));
router.delete('/:id/book', authenticate, asyncHandler(cancelBooking));
router.post('/:id/bookings/:bookingId/accept', authenticate, asyncHandler(acceptBooking));
router.post('/:id/bookings/:bookingId/reject', authenticate, asyncHandler(rejectBooking));

export default router;
