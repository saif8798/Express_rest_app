const { buildSchema } = require("graphql");

module.exports = buildSchema(`
    input UserInputData {
        email: String!
        name: String!
        password: String!
    }
    
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageURL: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

    type User {
        _id: ID!
        email: String!
        name: String!
        password: String
        posts: [Post!]!
    }
    
    type RootQuery {
        hello: String
    }

    type RootMutation {
        createUser(userInput: UserInputData): User!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }

`);
