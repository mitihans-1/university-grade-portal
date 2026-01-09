const express = require('express');
const router = express.Router();
const models = require('../models');
const Book = models.Book;
const auth = require('../middleware/auth');
const logAction = require('../utils/logger');
const { Op } = require('sequelize');

// @route   GET api/library
// @desc    Get all books
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { search, category } = req.query;
        let whereClause = {};

        if (search) {
            whereClause.title = { [Op.like]: `%${search}%` };
        }
        if (category) {
            whereClause.category = category;
        }

        const books = await Book.findAll({
            where: whereClause,
            order: [['title', 'ASC']]
        });

        res.json(books);
    } catch (err) {
        console.error('Error fetching books:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/library
// @desc    Add a book
// @access  Private (Admin)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { title, author, isbn, category } = req.body;

        const book = await Book.create({
            title,
            author,
            isbn,
            category
        });

        await logAction({
            action: 'ADD_BOOK',
            req,
            details: { title, author },
            resourceId: book.id
        });

        res.json(book);
    } catch (err) {
        console.error('Error adding book:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/library/:id/issue
// @desc    Issue a book to a student
// @access  Private (Admin)
router.post('/:id/issue', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { studentId, days = 14 } = req.body;
        const book = await Book.findByPk(req.params.id);

        if (!book) return res.status(404).json({ msg: 'Book not found' });
        if (book.status !== 'available') return res.status(400).json({ msg: 'Book is not available' });

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + parseInt(days));

        book.status = 'issued';
        book.holderId = studentId;
        book.dueDate = dueDate;
        await book.save();

        if (req.io) {
            req.io.to(`student_${studentId}`).emit('notification', {
                type: 'book_issued',
                title: 'Book Issued',
                message: `You have borrowed: ${book.title}. Due date: ${dueDate.toLocaleDateString()}`
            });
        }

        await logAction({
            action: 'ISSUE_BOOK',
            req,
            details: { title: book.title, studentId, dueDate },
            resourceId: book.id
        });

        res.json(book);
    } catch (err) {
        console.error('Error issuing book:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/library/:id/return
// @desc    Return a book
// @access  Private (Admin)
router.post('/:id/return', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const book = await Book.findByPk(req.params.id);
        if (!book) return res.status(404).json({ msg: 'Book not found' });

        const previousHolder = book.holderId;

        book.status = 'available';
        book.holderId = null;
        book.dueDate = null;
        await book.save();

        await logAction({
            action: 'RETURN_BOOK',
            req,
            details: { title: book.title, returnedBy: previousHolder },
            resourceId: book.id
        });

        res.json(book);
    } catch (err) {
        console.error('Error returning book:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE api/library/:id
// @desc    Delete a book
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

        await Book.destroy({ where: { id: req.params.id } });
        res.json({ msg: 'Book deleted' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
