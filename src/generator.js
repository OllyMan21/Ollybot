function generator(lim) {
    const target = Math.ceil(1 + Math.random() * lim);
    const comps = [];

    for (let i = 0; i < Math.ceil(Math.random() * 4 + 3); ++i) {
        let temp = Math.ceil(1 + Math.random() * 5 * Math.log(lim));
        if (temp == target) {
            i -= 1;
        } else {
            comps.push(temp);
        }
    }
    
    return [target, comps]
}

exports.generator = generator;