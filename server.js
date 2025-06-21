const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

const PORT = 5000;
const HOST = '0.0.0.0'; // Toegankelijk voor externe verzoeken

app.use(express.json());
app.use(express.static(path.join(__dirname))); // Zorg ervoor dat statische bestanden beschikbaar zijn

// Database connection
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Database connected');
  
  // Create users table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    naam TEXT UNIQUE NOT NULL,
    wachtwoord TEXT NOT NULL,
    punten INTEGER DEFAULT 0
  )`, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table ready');
    }
  });
  
  // Create admin settings table
  db.run(`CREATE TABLE IF NOT EXISTS admin_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_name TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error('Error creating admin_settings table:', err);
    } else {
      console.log('Admin settings table ready');
      
      // Insert default admin password if not exists (only after table is created)
      db.run(`INSERT OR IGNORE INTO admin_settings (setting_name, setting_value) 
              VALUES ('admin_password', 'admin123')`, (err) => {
        if (err) {
          console.error('Error inserting default admin password:', err);
        } else {
          console.log('Default admin password set');
        }
      });
    }
  });
});

// Serve the main index.html file at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Zorg ervoor dat het pad correct is
});

// Inloggen gebruiker
app.post('/api/login', (req, res) => {
  const { naam, wachtwoord } = req.body;

  db.get('SELECT naam, wachtwoord, punten FROM users WHERE naam = ?', [naam], (error, row) => {
    if (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ error: 'Server error' });
    }

    if (row) {
      if (wachtwoord === row.wachtwoord) {
        res.json({
          success: true,
          user: { naam: row.naam, punten: row.punten },
        });
      } else {
        res.status(401).json({ error: 'Onjuiste gebruikersnaam of wachtwoord' });
      }
    } else {
      res.status(401).json({ error: 'Onjuiste gebruikersnaam of wachtwoord' });
    }
  });
});

// Registreer nieuwe gebruiker
app.post('/api/register', (req, res) => {
  const { naam, wachtwoord, punten } = req.body;

  db.get('SELECT naam FROM users WHERE naam = ?', [naam], (error, row) => {
    if (error) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (row) {
      return res.status(400).json({ error: 'Gebruiker bestaat al' });
    }

    db.run('INSERT INTO users (naam, wachtwoord, punten) VALUES (?, ?, ?)', [naam, wachtwoord, punten || 0], function(error) {
      if (error) {
        return res.status(500).json({ error: 'Registration failed' });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
  });
});

// Update gebruiker punten
app.post('/api/update-points', (req, res) => {
  const { naam, punten } = req.body;

  db.run('UPDATE users SET punten = ? WHERE naam = ?', [punten, naam], function(error) {
    if (error) {
      console.error('Error updating points:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes > 0) {
      res.json({ message: 'Points updated successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});

// Get user by name (for refreshing points)
app.get('/api/user/:naam', (req, res) => {
  const { naam } = req.params;

  db.get('SELECT naam, punten FROM users WHERE naam = ?', [naam], (error, row) => {
    if (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Server error' });
    }

    if (row) {
      res.json({
        success: true,
        user: { naam: row.naam, punten: row.punten }
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});

// Admin authentication middleware
function adminAuth(req, res, next) {
  const password = req.headers['admin-password'] || req.body.adminPassword;
  
  db.get('SELECT setting_value FROM admin_settings WHERE setting_name = ?', ['admin_password'], (error, row) => {
    if (error) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    const correctPassword = row ? row.setting_value : 'admin123';
    
    if (password !== correctPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    next();
  });
}

// Admin route to view all users (including passwords)
app.get('/api/admin/users', adminAuth, (req, res) => {
  db.all('SELECT id, naam, wachtwoord, punten FROM users ORDER BY punten DESC', (error, rows) => {
    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Admin route to update user
app.post('/api/admin/update-user', adminAuth, (req, res) => {
  const { userId, naam, wachtwoord, punten } = req.body;

  db.run('UPDATE users SET naam = ?, wachtwoord = ?, punten = ? WHERE id = ?', 
    [naam, wachtwoord, punten, userId], function(error) {
    if (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes > 0) {
      res.json({ message: 'User updated successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});

// Admin route to delete user
app.delete('/api/admin/delete-user/:id', adminAuth, (req, res) => {
  const userId = req.params.id;

  db.run('DELETE FROM users WHERE id = ?', [userId], function(error) {
    if (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes > 0) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});

// Public route to get users for leaderboard (without passwords)
app.get('/api/users', (req, res) => {
  db.all('SELECT naam, punten FROM users ORDER BY punten DESC', (error, rows) => {
    if (error) {
      console.error('Error fetching users for leaderboard:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Admin route to get admin settings
app.get('/api/admin/settings', adminAuth, (req, res) => {
  db.get('SELECT setting_value FROM admin_settings WHERE setting_name = ?', ['admin_password'], (error, row) => {
    if (error) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ admin_password: row ? row.setting_value : 'admin123' });
  });
});

// Admin route to update admin password
app.post('/api/admin/update-password', adminAuth, (req, res) => {
  const { newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Wachtwoord moet minimaal 6 karakters lang zijn' });
  }

  db.run('UPDATE admin_settings SET setting_value = ? WHERE setting_name = ?', 
    [newPassword, 'admin_password'], function(error) {
    if (error) {
      console.error('Error updating admin password:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ message: 'Admin wachtwoord succesvol bijgewerkt' });
  });
});

// Admin route to download database
app.get('/api/admin/download-database', adminAuth, (req, res) => {
  const fs = require('fs');
  const databasePath = './database.sqlite';
  
  try {
    if (!fs.existsSync(databasePath)) {
      return res.status(404).json({ error: 'Database bestand niet gevonden' });
    }

    const filename = `database.sqlite`;
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(databasePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming database file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Fout bij downloaden van database' });
      }
    });
    
  } catch (error) {
    console.error('Error downloading database:', error);
    res.status(500).json({ error: 'Fout bij downloaden van database' });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close(err => {
    if (err) {
      console.error('Error shutting down database connection:', err);
    }
    process.exit(0);
  });
});

// Start de server
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});
