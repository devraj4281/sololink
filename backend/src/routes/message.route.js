import express from 'express';
import { getAllContacts,getChatPartners,getMessagesByUserId,sendMessage } from '../controller/message.controller';
import { protectRoute } from '../middleware/auth.middleware';
import {arcjetProtection} from "../middleware/arcjet.middleware";


const router =express.Router();

router.use(arcjetProtection,protectRoute);

router.get('/contacts',getAllContacts);
router.get('/chats',getChatPartners);
router.get('/:id',getMessagesByUserId);
router.get('/send/:id',sendMessage);

export default router;