import authRouter from './auth';
import bioRouter from './bio'
import profileRouter from'./profile'
import postRouter from './post'
import relationshipRouter from './relationship'
import conversationRouter from './conversation'

const initRoutes = (app) => {

    app.use('/auth', authRouter);
    app.use('/bio', bioRouter)
    app.use('/profile', profileRouter)
    app.use('/post', postRouter)
    app.use('/relationship', relationshipRouter)
    app.use('/conversation', conversationRouter)

    return app.use('/', (req, res) => {
        res.send('Server is running');
    });
}

export default initRoutes;