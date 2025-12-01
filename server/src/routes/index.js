import authRouter from './auth';
import bioRouter from './bio'
import profileRouter from'./profile'
import postRouter from './post'

const initRoutes = (app) => {

    app.use('/auth', authRouter);
    app.use('/bio', bioRouter)
    app.use('/profile', profileRouter)
    app.use('/post', postRouter)

    return app.use('/', (req, res) => {
        res.send('Server is running');
    });
}

export default initRoutes;