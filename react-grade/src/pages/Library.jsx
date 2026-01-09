import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { Book, User, Plus, Search, ArrowRight, Check, X } from 'lucide-react';

const Library = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Admin Add Book State
    const [isAdding, setIsAdding] = useState(false);
    const [newBook, setNewBook] = useState({
        title: '',
        author: '',
        isbn: '',
        category: ''
    });

    useEffect(() => {
        fetchBooks();
    }, [searchTerm]);

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const data = await api.getBooks(searchTerm);
            setBooks(data || []);
        } catch (error) {
            console.error('Error fetching books:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBook = async (e) => {
        e.preventDefault();
        try {
            await api.addBook(newBook);
            showToast('Book added successfully', 'success');
            setNewBook({ title: '', author: '', isbn: '', category: '' });
            setIsAdding(false);
            fetchBooks();
        } catch (error) {
            showToast('Failed to add book', 'error');
        }
    };

    const handleIssue = async (id) => {
        const studentId = window.prompt("Enter Student ID to issue to:");
        if (!studentId) return;

        try {
            await api.issueBook(id, studentId);
            showToast('Book issued successfully', 'success');
            fetchBooks();
        } catch (error) {
            showToast('Failed to issue book', 'error');
        }
    };

    const handleReturn = async (id) => {
        if (!window.confirm('Mark this book as returned?')) return;
        try {
            await api.returnBook(id);
            showToast('Book returned', 'success');
            fetchBooks();
        } catch (error) {
            showToast('Failed to return book', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this book permanently?')) return;
        try {
            await api.deleteBook(id);
            showToast('Book deleted', 'success');
            fetchBooks();
        } catch (error) {
            showToast('Failed to delete book', 'error');
        }
    };

    if (loading && !searchTerm) return <LoadingSpinner fullScreen />;

    return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: '0 0 10px 0' }}>📚 Library</h1>
                    <p style={{ color: '#666' }}>Browse and manage library collection.</p>
                </div>
                {user.permissions?.includes('manage_users') && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: isAdding ? '#f44336' : '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '5px'
                        }}
                    >
                        {isAdding ? <X size={18} /> : <Plus size={18} />}
                        {isAdding ? 'Cancel' : 'Add Book'}
                    </button>
                )}
            </div>

            {/* Add Book Form (Admin) */}
            {isAdding && (
                <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                    <form onSubmit={handleAddBook} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
                        <input
                            placeholder="Title"
                            value={newBook.title}
                            onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                            required
                            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                        />
                        <input
                            placeholder="Author"
                            value={newBook.author}
                            onChange={e => setNewBook({ ...newBook, author: e.target.value })}
                            required
                            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                        />
                        <input
                            placeholder="ISBN (Optional)"
                            value={newBook.isbn}
                            onChange={e => setNewBook({ ...newBook, isbn: e.target.value })}
                            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                        />
                        <button type="submit" style={{ backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                            Save Book
                        </button>
                    </form>
                </div>
            )}

            {/* Search */}
            <div style={{ marginBottom: '20px', position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                <input
                    type="text"
                    placeholder="Search for books..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px 12px 12px 45px',
                        borderRadius: '30px',
                        border: '1px solid #ddd',
                        outline: 'none',
                        fontSize: '16px'
                    }}
                />
            </div>

            {/* Books Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {books.map(book => (
                    <div key={book.id} style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        borderLeft: `5px solid ${book.status === 'available' ? '#4caf50' : '#ff9800'}`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <Book size={24} color="#555" />
                            <span style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                borderRadius: '10px',
                                backgroundColor: book.status === 'available' ? '#e8f5e9' : '#fff3e0',
                                color: book.status === 'available' ? '#2e7d32' : '#ef6c00',
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                            }}>
                                {book.status}
                            </span>
                        </div>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{book.title}</h3>
                        <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '13px' }}>by {book.author}</p>

                        {book.status === 'issued' && (
                            <div style={{ marginBottom: '15px', fontSize: '12px', color: '#d32f2f' }}>
                                Due: {new Date(book.dueDate).toLocaleDateString()}
                            </div>
                        )}

                        {user.permissions?.includes('manage_users') && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                {book.status === 'available' ? (
                                    <button
                                        onClick={() => handleIssue(book.id)}
                                        style={{ flex: 1, padding: '8px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Issue
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleReturn(book.id)}
                                        style={{ flex: 1, padding: '8px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Return
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(book.id)}
                                    style={{ padding: '8px', backgroundColor: 'transparent', color: '#999', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {books.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                    No books found.
                </div>
            )}
        </div>
    );
};

export default Library;
