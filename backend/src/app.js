const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { errorHandler, notFound } = require('./middlewares/errorHandler');
const requestLogger = require('./middlewares/requestLogger');
const swaggerUi = require('swagger-ui-express');
const { spec } = require('./swagger');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const locationRoutes = require('./routes/location.routes');
const amenityRoutes = require('./routes/amenity.routes');
const roomRoutes = require('./routes/room.routes');
const bookingRoutes = require('./routes/booking.routes');
const reviewRoutes = require('./routes/review.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const reportRoutes = require('./routes/report.routes');
const imageRoutes = require('./routes/image.routes');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : true,
    credentials: true,
  })
);

app.use(requestLogger);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests' },
    keyGenerator: (req) => req.ip,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Expose uploaded files
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/amenities', amenityRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/images', imageRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
