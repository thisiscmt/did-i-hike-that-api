import sequelize from 'sequelize';

import { User } from '../db/models/user.js';
import * as SharedService from './sharedService.js';
import { LoginResult } from '../models/models';

export const loginUser = async (email: string, password: string) => {
    const result: LoginResult = {
        success: false,
        fullName: '',
        email: '',
        role: '',
        userId: ''
    }

    const user = await User.findOne({
        where: sequelize.where(
            sequelize.fn('lower', sequelize.col('email')),
            sequelize.fn('lower', email)
        )
    });

    if (user) {
        const passwordMatch = await SharedService.passwordMatch(user.password, password);

        if (passwordMatch) {
            await User.update({ lastLogin: new Date().getTime() }, {
                where: {
                    id: user.id
                }
            });

            result.success = true;
            result.fullName = user.fullName;
            result.email = user.email;
            result.role = user.role;
            result.userId = user.id;
        }
    }

    return result;
};

export const validUser = async (email: string) => {
    const user = await User.findOne({
        where: sequelize.where(
            sequelize.fn('lower', sequelize.col('email')),
            sequelize.fn('lower', email)
        )
    });

    return !!user;
};

export const userExists = async (userId: string): Promise<boolean> => {
    const user = await User.findByPk(userId, {
        attributes: ['id']
    });

    return !!user;
};

export const getUsers = async () => {
    const result = await User.findAll({
        attributes: ['id', 'fullName', 'email', 'role', 'lastLogin'],
        order: ['fullName', 'email']
    });

    return {
        rows: result,
    };
};

export const getUser = async (userId: string) => {
    return await User.findByPk(userId, {
        attributes: ['id', 'fullName', 'email', 'role', 'lastLogin', 'createdAt', 'updatedAt']
    });
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
    return await User.findOne({
        attributes: ['id'],
        where: {
            email
        }
    });
};

export const createUser = async (fullName: string, email: string, password: string, role = 'Standard') => {
    const storedPassword = await SharedService.hashPassword(password);

    await User.create({
        fullName,
        email,
        password: storedPassword,
        role,
        lastLogin: 0
    });
};

export const updateUser = async (currentUser: User, fullName?: string, email?: string, password?: string, role?: string) => {
    const newUser = {} as User;

    if (fullName) {
        newUser.fullName = fullName;
    }

    if (email) {
        newUser.email = email;
    }

    if (password) {
        newUser.password = await SharedService.hashPassword(password);
    }

    if (role) {
        newUser.role = role;
    }

    await User.update(newUser, {
        where: {
            id: currentUser.id
        }
    });
};

export const deleteUser = async (userId: string): Promise<number> => {
    return await User.destroy({
        where: {
            id: userId
        }
    });
};
