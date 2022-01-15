
import { Router } from "express";
import { getSession } from "../database/sessions";
import { getUser } from "../database/user";
import { validate } from 'uuid';

export const authRouter = Router();

authRouter.get('/:session?', async (req, res) => {
    try {
        if(!validate(req.params.session)) {
            throw "Incorrect UUID";
        }

        const session = await getSession(req.params.session);
        if(!session) {
            throw "Session not found";
        }

        const user = await getUser(session.id);
        if(!user) {
            throw "User not found";
        }

        return res.render('authPage', {
            first_name: user.first_name,
            last_name: user.last_name
        });
    } catch(err) {
        return res.render('auth404');
    }
})
