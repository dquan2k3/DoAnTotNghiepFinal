import express from 'express'
const router = express.Router()
import * as postController from '../controller/post'
import multer from 'multer'
import { verifyToken } from '../middleware/verifyToken';

const upload = multer({ storage: multer.memoryStorage() })

router.post(
  '/uploadPost',
  verifyToken,
  upload.array('files'), // nhận nhiều file từ field 'files'
  postController.uploadPost
)

router.get('/getProfilePosts', verifyToken, postController.getProfilePosts)
router.get('/homePosts', verifyToken, postController.getAllPosts)
router.post('/singlePost', verifyToken, postController.getSinglePost)

router.post('/getImage', verifyToken, postController.getImage)
router.post('/getVideo', verifyToken, postController.getVideo)

router.post('/reactPost', verifyToken, postController.reactPost)
router.post('/commentPost', verifyToken, postController.commentPost)
router.get('/loadCountReact', verifyToken, postController.loadCountReact)
router.post('/sharePost', verifyToken, postController.sharePost)

router.post('/searchPost', verifyToken, postController.searchPost)

router.post('/reportPost', verifyToken, postController.reportPost)
router.delete('/deletePost', verifyToken, postController.deletePost)

export default router