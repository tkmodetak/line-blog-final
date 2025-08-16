module.exports = (req, res) => res.status(200).json({success: true, time: new Date().toISOString()});
