const pool = require('./pool');

async function insertNewUser(firstName, lastName, username, hashedPassword) {
    const result = await pool.query(
        'INSERT INTO users (first_name, last_name, username, password) VALUES ($1, $2, $3, $4) RETURNING *',
        [firstName, lastName, username, hashedPassword]
    );
    return result.rows[0];
}

async function getAllUsers() {
    const result = await pool.query('SELECT * FROM users');
    return result.rows;
}

async function findUserByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
}

async function findUserById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
}   

async function updateUserMemberStatus(username, status) {
    const result = await pool.query(
        'UPDATE users SET member_status = $1 WHERE username = $2 RETURNING *',
        [status, username]
    );
    return result.rows[0];
}

async function setAdminStatus(username, status) {
    const result = await pool.query(
        'UPDATE users SET admin_status = $1 WHERE username = $2 RETURNING *',
        [status, username]
    );
    return result.rows[0];
}

async function getAllMessages() {
    const result = await pool.query(
        `SELECT messages.*, users.username 
        FROM messages 
        JOIN users ON messages.user_id = users.id 
        ORDER BY messages.created_on DESC`
    );
    return result.rows;
}

async function insertNewMessage(userId, message) {
    const result = await pool.query(
        'INSERT INTO messages (user_id, message) VALUES ($1, $2) RETURNING *',
        [userId, message]
    );
    return result.rows[0];
}  

async function deleteMessageById(messageId) {
    await pool.query(
        'DELETE FROM messages WHERE id = $1',
        [messageId]
    );
}

module.exports = {
    insertNewUser,
    getAllUsers,
    findUserByUsername,
    findUserById,
    getAllMessages,
    insertNewMessage,
    updateUserMemberStatus,
    setAdminStatus,
    deleteMessageById
};