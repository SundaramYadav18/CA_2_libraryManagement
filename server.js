require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const Book = require('./models/Book');

const app = express();
const port = Number.parseInt(process.env.PORT, 10) || 3000;
const mongoUri = process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/library';

app.use(express.json());

app.post('/api/books', async (req, res) => {
	try {
		const { title, author, category } = req.body || {};

		if (typeof title !== 'string' || !title.trim()) {
			return res.status(400).json({ message: 'Title is required' });
		}

		const book = await Book.create({ title, author, category });
		return res.status(201).json(book);
	} catch (error) {
		return res.status(500).json({ message: 'Could not add the book' });
	}
});

app.get('/api/books', async (req, res) => {
	try {
		const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
		const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
		const skip = (page - 1) * limit;

		const [books, total] = await Promise.all([
			Book.find().skip(skip).limit(limit),
			Book.countDocuments()
		]);

		return res.json({
			books,
			currentPage: page,
			totalRecords: total
		});
	} catch (error) {
		return res.status(500).json({ message: 'Could not retrieve books' });
	}
});

app.patch('/api/books/:id', async (req, res) => {
	try {
		const { availability } = req.body || {};

		if (typeof availability !== 'boolean') {
			return res.status(400).json({ message: 'Availability must be true or false' });
		}

		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res.status(400).json({ message: 'Invalid book ID' });
		}

		const book = await Book.findByIdAndUpdate(
			req.params.id,
			{ availability },
			{ returnDocument: 'after', runValidators: true }
		);

		if (!book) {
			return res.status(404).json({ message: 'Book not found' });
		}

		return res.json(book);
	} catch (error) {
		return res.status(500).json({ message: 'Could not update the book' });
	}
});

mongoose.connect(mongoUri)
	.then(() => {
		console.log('Connected to MongoDB');
		app.listen(port, () => {
			console.log(`Server is running on port ${port}`);
		});
	})
	.catch((error) => {
		console.error('Could not connect to MongoDB:', error.message);
		process.exit(1);
	});