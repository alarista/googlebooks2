const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                //.populate('books')
                return userData;
            }
            throw new AuthenticationError('Not logged in')
        },
    },
    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return { token, user };
        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new AuthenticationError('Wrong login information');
            }
            const correctPass = await user.isCorrectPassword(password);
            if (!correctPass) {
                throw new AuthenticationError('Wrong login information');
            }
            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, { input }, { user }) => {
            if (user) {
                const refreshedUser = await User.findByIdAndUpdate(
                    { _id: user._id },
                    { $push: { savedBooks: input } },
                    { new: true }
                );

                return refreshedUser;
            }
            throw new AuthenticationError('Log in to complete this task');
        },
        removeBook: async (parent, { bookId }, context) => {
            if(context.user) {
            const refreshedUser = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $pull: { savedBooks: { bookId } } },
                { new: true }
            );
            return refreshedUser;
            }
            throw new AuthenticationError('Youre not logged in. Please login first!');
        }
    }
};

module.exports = resolvers;
