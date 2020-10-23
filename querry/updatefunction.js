module.exports = function (querryparams) {
  let q = "";
  for (let i = 0; i < querryparams.length; i++) {
    q += ` UPDATE calendar_results SET bingo=${querryparams[i].bingo},goals1=${querryparams[i].goals1},goals2=${querryparams[i].goals2} WHERE id=${querryparams[i].id};`;
  }
  return q;
};
