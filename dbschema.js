let db = {
    users: [
        {
            userId: '1uSxcbwMlRhXOaDQguIwN5L186l2',
            email: 'OtiOti@gmail.com',
            handle: 'Oty',
            createdAt: '2020-04-27T18:21:37.599Z',
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/elearning-d0823.appspot.com/o/60156027445.jpg?alt=media',
            bio: 'Hello my name is Otilia, nice to meet you',
            website: 'https://user.com',
            location: 'Bucharest, Romania'
        }
    ],

    screams: [
    {
        userHandle: 'user',
        body: 'this is a scream ',
        createdAt: '2020-04-15T22:06:20.870Z',
        likeCount: 5,
        commentCount: 2

    }
    ],

    comments: [
        {
            userHandle: 'user',
            screamId: 'GYUEWHJBF',
            body: 'nice one!',
            createdAt:'2020-05-15T10:59:52.798Z'
        }
    ],

notifications: [
    {
        recipient: 'user',
        sender: 'john',
        read: 'true' | 'false',
        screamId: 'hPRklcSNyKoyekLTAMdd',
        type: 'like | comment',
        createdAt: '2020-05-15T10:59:52.7982'
    }
]
};

const userDetails = {
    //Redux data
    credentials: {
            userId: '1uSxcbwMlRhXOaDQguIwN5L186l2',
            email: 'OtiOti@gmail.com',
            handle: 'Oty',
            createdAt: '2020-04-27T18:21:37.599Z',
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/elearning-d0823.appspot.com/o/60156027445.jpg?alt=media',
            bio: 'Hello my name is Otilia, nice to meet you',
            website: 'https://user.com',
            location: 'Bucharest, Romania'
        },
    likes: [
        {
            userHandle: 'user',
            screamId: 'hhtrsh'
        },
        {
            userHandle: 'user',
            screamId: 'guewfw'
        }
    ]
};