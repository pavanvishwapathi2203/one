const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

// Connect to MongoDB
// Check if mongoose is already connected
if (mongoose.connection.readyState === 0) {
    mongoose.connect('mongodb://host.docker.internal:27017/mydatabase', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).catch(err => console.error('MongoDB connection error:', err));
}

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define Schema and Model
const userSchema = new mongoose.Schema({
    name: String,
    age: Number
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve HTML and CSS files

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/add-user', async (req, res) => {
    const { name, age } = req.body;
    const user = new User({ name, age });
    await user.save();
    res.redirect('/show-users'); // After adding, redirect to the users page
}); 

app.get('/show-users', async (req, res) => {
    const users = await User.find();
    let userListHTML = '<h1>Users in Database</h1><ul>';
    users.forEach(user => {
        userListHTML += `
            <li>
                ${user.name} - ${user.age} 
                <button onclick="removeUser('${user._id}')">Remove</button>
            </li>
        `;
    });
    userListHTML += '</ul><br><a href="/">Go Back</a>';
    userListHTML += `
        <script>
            // JavaScript for the "Remove" button functionality
            function removeUser(userId) {
                if (confirm("Are you sure you want to delete this user?")) {
                    fetch('/remove-user/' + userId, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    })
                    .then(response => {
                        if (response.ok) {
                            alert('User deleted');
                            location.reload(); // Reload the page to reflect changes
                        } else {
                            alert('Failed to delete user');
                        }
                    })
                    .catch(err => console.error('Error:', err));
                }
            }
        </script>
    `;
    res.send(userListHTML);
});

// Delete User
app.delete('/remove-user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await User.findByIdAndDelete(id);
        res.status(200).send('User deleted');
    } catch (err) {
        res.status(500).send('Failed to delete user');
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
