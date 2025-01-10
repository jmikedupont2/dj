// __mocks__/jquery.js
const $ = jest.fn(() => ({
  text: jest.fn(() => "mock-seed"), // Mock the .text() method
  // Add other jQuery methods your code uses
}));

export default $;