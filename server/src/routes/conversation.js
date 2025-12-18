import express from 'express';
import * as conversationController from '../controller/conversation';
import { verifyToken } from '../middleware/verifyToken';

const router = express.Router();

router.get('/incomeUser/:userId', verifyToken, conversationController.getIncomeUser);
router.post('/getConversationDetail', verifyToken, conversationController.getConversationDetail);
router.post('/loadMessage', verifyToken, conversationController.loadMessage);
router.get('/getMessageList', verifyToken, conversationController.getMessageList);


export default router;
