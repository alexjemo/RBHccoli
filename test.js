async function test() {
    try {
        await dbAPI.getEvents();
    } catch(e) {
        console.log("Caught:", e.message);
    } finally {
        console.log("Finally");
    }
}
test();
