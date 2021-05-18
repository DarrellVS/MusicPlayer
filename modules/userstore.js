let user = {
    api_key: undefined,
    username: undefined,
    spotify: {
        access_token: undefined,
        refresh_token: undefined,
        expiration_time: undefined
    }
}

module.exports = {
    setAPIKey: key => {
        user.api_key = key
    },

    getAPIKey: () => user.api_key,

    setUsername: username => {
        user.username = username
    },

    getUsername: () => user.username,

    getSpotifyTokens: () => user.spotify,

    setSpotifyTokens: ({access_token, refresh_token, expiration_time}) => {
        if(access_token === undefined || refresh_token === undefined || expiration_time === undefined) throw new Error('Provide all fields when saving spotify tokens');
        user.spotify = {
            access_token,
            refresh_token,
            expiration_time
        }
    }
}