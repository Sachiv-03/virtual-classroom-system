const { google } = require('googleapis');
const GoogleToken = require('../models/GoogleToken');

/**
 * Creates an OAuth2 client with the credentials from the environment.
 */
const createOAuth2Client = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
};

/**
 * Creates a Google Meet link for a class.
 * @param {Object} classData { title, startTime, endTime, date }
 * @param {String} userId - The teacher's user ID who authenticated with Google
 */
exports.createMeetLink = async (classData, userId) => {
    try {
        const oauth2Client = createOAuth2Client();

        // Fetch tokens from DB
        const savedToken = await GoogleToken.findOne({ userId });
        if (!savedToken) {
            throw new Error('Google account not authenticated. Please link your Google account first.');
        }

        oauth2Client.setCredentials({
            access_token: savedToken.accessToken,
            refresh_token: savedToken.refreshToken,
            expiry_date: savedToken.expiryDate
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Calculate start and end times
        // Assuming startTime and endTime are in "HH:mm" format and we need a date
        const classDate = classData.date || new Date().toISOString().split('T')[0];
        const startDateTime = new Date(`${classDate}T${classData.startTime}:00`).toISOString();
        const endDateTime = new Date(`${classDate}T${classData.endTime}:00`).toISOString();

        const event = {
            summary: `Class: ${classData.title}`,
            description: `Scheduled class for ${classData.title}`,
            start: {
                dateTime: startDateTime,
                timeZone: 'UTC', // Change as per requirement
            },
            end: {
                dateTime: endDateTime,
                timeZone: 'UTC',
            },
            conferenceData: {
                createRequest: {
                    requestId: `meeting-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
        });

        return response.data.hangoutLink;
    } catch (error) {
        console.error('Error creating Google Meet link:', error);
        throw error;
    }
};

exports.getAuthUrl = () => {
    const oauth2Client = createOAuth2Client();
    const scopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // Important to get refresh token
        scope: scopes,
        prompt: 'consent'
    });
};

exports.handleAuthCallback = async (code) => {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
};
