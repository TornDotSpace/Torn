#!/usr/bin/python3

import pymongo
from pymongo import MongoClient
from math import floor
import datetime
from decimal import Decimal

MONGO_CONNECTION_STR = "mongodb://localhost:27017/torn"
PATH = "../client/leaderboard/index.html"

def __init__():
    updateLB(MONGO_CONNECTION_STR, PATH)
    pass

def updateLB(conn_str, path):

    # Connect to DB
    client = MongoClient(conn_str)
    db = client.torn
    players = db.players
    
    newFile  = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><meta charset="utf-8"/><html xmlns="http://www.w3.org/1999/xhtml" dir="ltr" lang="en"><head><title>Leaderboard</title><link rel="stylesheet" href="../page.css" /></head><body><br><br><h1><div style="padding: 20px"><center><font color="#0099ff">Leaderboard</font></center></div></h1><font color="#0099ff"><center><nobr><table>'

    # Teams

    teamdata = {    'red':   {'dispcol': 'pink', 'players': 0.001, 'money': 0, 'kills': 0, 'tech': 0, 'experience': 0, 'rank': 0, 'spot': 0},
                    'blue':  {'dispcol': 'cyan', 'players': 0.001, 'money': 0, 'kills': 0, 'tech': 0, 'experience': 0, 'rank': 0, 'spot': 0},
                    'green': {'dispcol': 'lime', 'players': 0.001, 'money': 0, 'kills': 0, 'tech': 0, 'experience': 0, 'rank': 0, 'spot': 0}} #players



    # Players
    playerFile = '<tr><th>#</th><th>Name</th><th>Exp</th><th>Rank</th><th>Kills</th><th>Money</th><th>Tech</th></tr>'
    # Grab needed data
    i = 0
    for player in players.find().sort("experience", pymongo.DESCENDING):
        i = i + 1

        name = player['name']
        if "O" in name:
            continue
        kills = player['kills']
        rank = player['rank']
        tech = int(((player['thrust2'] + player['radar2'] + player['capacity2'] + player['agility2'] + player['maxHealth2'] + player['energy2'])/6-1)*8*100)/100
        xp = int(player['experience'])
        money = player['money']
        color = "pink" if (player['color'] == 'red') else ("lime" if (player['color'] == 'green') else 'cyan')

        teamdata[player['color']]['players'] = int(teamdata[player['color']]['players']+1)
        teamdata[player['color']]['experience'] += player['experience']
        teamdata[player['color']]['money'] += money
        teamdata[player['color']]['kills'] += kills
        teamdata[player['color']]['tech'] += tech
        teamdata[player['color']]['rank'] += rank
        teamdata[player['color']]['spot'] += i
        
        out = ( '<tr style="color:' + color + ';"><td>' + str(i) + ".</td><td>" + name + "</td><td> " + str(xp) + " </td><td>" + str(rank) + "</td><td>" + str(kills) + "</td><td>" + 
        ((str(int(money //1000000+.5))+"M") if money >10000000 else str(int(money//1000+.5))+"K")  + "</td><td>" + str(tech) + "</td></tr>")

        playerFile = playerFile + out #append to file
    
    teamFile = ( '<tr style="color:#0099ff;"><td>-Average Place-</td><td>-Total Players-</td><td>-Average Experience-</td><td>-Average Rank-</td><td>-Average Kills-</td><td>-Average Money-</td><td>-Average Tech-</td></tr>')
    for key in teamdata:
        teamFile += ( '<tr style="color:' + teamdata[key]['dispcol'] + ';"><td>' + key + ": " + str(int(teamdata[key]['spot']/teamdata[key]['players'])) + "</td><td> " + str(int(teamdata[key]['players'])) + "</td><td>" + str(int(teamdata[key]['experience']/teamdata[key]['players'])) + " </td><td>" + str(int(teamdata[key]['rank']/teamdata[key]['players'])) + "</td><td>" + str(int(teamdata[key]['kills']/teamdata[key]['players'])) + "</td><td>" + str(int(teamdata[key]['money']/teamdata[key]['players'])) + "</td><td>" + str(int(teamdata[key]['tech']/teamdata[key]['players'])) + "</td></tr>")

    # Append rest of page
    newFile += teamFile + '<tr><td>---</td></tr>'
    newFile += playerFile
    newFile += '</table></nobr><br/>Last updated: ' + str(datetime.datetime.now()) + '</center></font></body></html>'

    # Write out
    lb = open(path, 'w')
    newFile = newFile.encode('utf-8')
    lb.write(newFile)
    lb.close()

    print("Updated leaderboard successfully!")
    exit(0)
__init__()
