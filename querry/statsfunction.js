module.exports = tab=>{
    let correctPoints=0
    let sumPoints=0
    for(let i=0; i<tab.length;i++){
        if(tab[i].bingo=="1"){
            sumPoints+=tab[i].cote_1;
            if(tab[i].guess==tab[i].bingo)correctPoints+=tab[i].cote_1;
        }
        if(tab[i].bingo=="2"){
            sumPoints+=tab[i].cote_2;
            if(tab[i].guess==tab[i].bingo)correctPoints+=tab[i].cote_2;
        }
        if(tab[i].bingo=="x"){
            sumPoints+=tab[i].cote_x;
            if(tab[i].guess==tab[i].bingo)correctPoints+=tab[i].cote_x;
        }
    }
    return {correctPoints,efficiency:parseFloat(((correctPoints/sumPoints)*100).toFixed(2))}
}