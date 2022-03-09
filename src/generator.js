function generator(lim) {
    const target = Math.ceil(1 + Math.random() * lim);
    const comps = [];

    for (let i = 0; i < Math.ceil(Math.random() * 4 + 3); ++i) {
        comps.push(Math.ceil(1 + Math.random() * 5 * Math.log(lim)))
    }
    
    return [target, comps]
}

exports.generator = generator;