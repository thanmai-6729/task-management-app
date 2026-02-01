const bcrypt = require('bcrypt');

describe('User Model Password Logic', () => {
    it('should correctly hash and compare passwords', async () => {
        const password = 'testpassword123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const isMatch = await bcrypt.compare(password, hashedPassword);
        const isNotMatch = await bcrypt.compare('wrongpassword', hashedPassword);

        expect(isMatch).toBe(true);
        expect(isNotMatch).toBe(false);
    });
});
