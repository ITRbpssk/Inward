const { hashPassword } = require("../src/utils/bcrypt");

(async () => {
    try {
        const password = "Password123";
        const hash = await hashPassword(password);

        console.log("Password:", password);
        console.log("Hash:", hash);
    } catch (err) {
        console.error(err);
    }
})();