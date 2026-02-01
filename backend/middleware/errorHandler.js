const errorHandler = (err, req, res, next) => {
    // Default status code
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // MySQL Duplicate Entry error
    if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 400;
        message = 'Duplicate entry found. This record already exists.';
    }

    // MySQL Connection/Protocol errors
    if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
        statusCode = 503;
        message = 'Service Unavailable: Database connection failed.';
    }

    res.status(statusCode).json({
        success: false,
        message: message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };
