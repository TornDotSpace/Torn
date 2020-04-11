#!/usr/bin/python3

import pymongo
from pymongo import MongoClient
from math import floor
import datetime

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
    
    newFile = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" dir="ltr" lang="en"><head><title>Leaderboard</title><link rel="stylesheet" href="../page.css" /></head><body><br><br><h1><div style="padding: 20px"><center><font color="#0099ff">Leaderboard</font></center></div></h1><font color="#0099ff"><center><nobr><table><tr><th>#</th><th>Name</th><th>Exp</th><th>Rank</th><th>Kills</th><th>Money</th><th>Tech</th></tr>'

    # Grab needed data
    i = 0
    for player in players.find().sort("experience", pymongo.DESCENDING):
        i = i + 1

        name = player['name']
        kills = player['kills']
        rank = player['rank']
        xp = player['experience']
        tech = ((player['thrust2'] + player['radar2'] + player['capacity2'] + player['agility2'] + player['maxHealth2']) * 2) / 10
        money = player['money']
        color = "pink" if (player['color'] == 'red') else 'cyan'
        
        out = ( '<tr style="color:' + color + ';"><td>' + str(i) + ".</td><td>" + name + "</td><td> " + str(xp) + " </td><td>" + str(rank) + "</td><td>" + str(kills) + "</td><td>" + 
        ((str(floor(money //1000000+.5))+"M") if money >10000000 else str(floor(money//1000+.5))+"K")  + "</td><td>" + str(tech) + "</td></tr>")

        # Alex Formatting (don't ask)
        newFile = newFile + out
    
    # Append rest of page
    newFile = newFile + ('</table></nobr><br/>Updates every 25 minutes Last updated: ' + str(datetime.datetime.now()) + '</center></font></body></html>')

    # Write out
    lb = open(path, 'w')
    lb.write(newFile)
    lb.close()

    print("Updated leaderboard successfully!")
    exit(0)
__init__()