const Book = require('../models/Book');
const fs = require('fs');
const sharp = require('sharp');

const extractYear = (value) => {
  if (typeof value === 'number') return value;
  const match = String(value).match(/\d{4}/);
  return match ? parseInt(match[0], 10) : NaN;
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => res.status(200).json(book))
    .catch(error => res.status(404).json({ error }));
};

exports.getBestRating = (req, res, next) => {
  Book.find().sort({ averageRating: -1 }).limit(3)
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
};

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;

  bookObject.year = extractYear(bookObject.year);

  const filename = req.file.filename.split('.')[0] + '.webp';

  sharp(req.file.path)
    .resize(500)
    .webp({ quality: 80 })
    .toFile('images/' + filename)
    .then(() => {
      fs.unlink(req.file.path, () => {});

      const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${filename}`,
        averageRating: 0,
        ratings: []
      });

      book.save()
        .then(() => res.status(201).json({ message: 'Livre enregistré !' }))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file ? {
    ...JSON.parse(req.body.book),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename.split('.')[0] + '.webp'}`
  } : { ...req.body };

  delete bookObject._userId;

  if (bookObject.year) {
    bookObject.year = extractYear(bookObject.year);
  }

  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (book.userId != req.auth.userId) {
        res.status(403).json({ message: 'unauthorized request' });
      } else {
        const finish = () => {
          Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Livre modifié !' }))
            .catch(error => res.status(401).json({ error }));
        };

        if (req.file) {
          const filename = book.imageUrl.split('/images/')[1];
          fs.unlink(`images/${filename}`, () => {
            const newFilename = req.file.filename.split('.')[0] + '.webp';
            sharp(req.file.path)
              .resize(500)
              .webp({ quality: 80 })
              .toFile('images/' + newFilename)
              .then(() => {
                fs.unlink(req.file.path, () => {});
                finish();
              })
              .catch(error => res.status(500).json({ error }));
          });
        } else {
          finish();
        }
      }
    })
    .catch(error => res.status(400).json({ error }));
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (book.userId != req.auth.userId) {
        res.status(403).json({ message: 'unauthorized request' });
      } else {
        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Livre supprimé !' }))
            .catch(error => res.status(401).json({ error }));
        });
      }
    })
    .catch(error => res.status(400).json({ error }));
};

exports.rateBook = (req, res, next) => {
  const userId = req.auth.userId;
  const grade = req.body.rating;

  Book.findOne({ _id: req.params.id })
    .then(book => {
      const alreadyRated = book.ratings.find(rating => rating.userId === userId);
      if (alreadyRated) {
        return res.status(400).json({ message: 'Vous avez déjà noté ce livre !' });
      }

      book.ratings.push({ userId: userId, grade: grade });

      const totalGrades = book.ratings.reduce((sum, rating) => sum + rating.grade, 0);
      book.averageRating = totalGrades / book.ratings.length;

      book.save()
        .then(updatedBook => res.status(200).json(updatedBook))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(404).json({ error }));
};