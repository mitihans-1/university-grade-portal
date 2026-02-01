/**
 * Simple Math CAPTCHA Utility
 */

const generateMathPuzzle = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let question = `${a} ${operator} ${b}`;
    let answer = operator === '+' ? a + b : a - b;

    return { question, answer };
};

module.exports = { generateMathPuzzle };
