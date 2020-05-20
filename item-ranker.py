# DISCLAIMER:
# This file belongs to voidweaver (https://github.com/voidweaver)
# The source code for the file is available in https://github.com/voidweaver/item-ranker

import sys
from termcolor import cprint, colored
from random import randint

INDENT = ' ' * 2


def pad(str, length, padder=' '):
    while len(str) < length:
        str = padder + str
    return str


def print_rank(list, color, head=''):
    if head != '':
        # cprint(head, color, attrs=['bold'])
        print(head)
    for i, item in enumerate(list):
        print(
            f'{INDENT}{pad(str(i + 1), len(str(len(list))))}:{INDENT}{item}')


def insert_elems(start, list, index):
    list = list[::-1]
    for item in list:
        start.insert(index, item)
    return start


def is_better(a, b):
    reversed = True if randint(0, 1) == 1 else False
    while True:
        print('Which is better? ', end='')
        if not reversed:
            print(str(a), end='')
            print(' or ', end='')
            print(str(b), end='')
        else:
            print(str(b), end='')
            print(' or ', end='')
            print(str(a), end='')
        print(': ')

        user_input = input()

        if user_input == str(a):
            return True
        elif user_input == str(b):
            return False
        else:
            sys.stderr.write('Invalid choice. Choose again.')


def rank(elems):
    if len(elems) <= 1:
        return elems
    elif len(elems) == 2:
        if is_better(elems[0], elems[1]):
            return elems
        else:
            return elems[::-1]

    middle = elems[0]
    less = []
    more = []
    for item in elems[1:]:
        if is_better(middle, item):
            less.append(item)
        else:
            more.append(item)

    less = rank(less)
    more = rank(more)

    return more + [middle] + less


def askExclude():
    isExclude = input(
        'Do you want to exclude some integer from the list? [ y / n ]').lower()
    if isExclude == 'y':
        return input('Exclude: ').split(',')
    elif isExclude != 'n':
        return askExclude()
    else:
        return []


print('Item ranker by comparison\n')

while True:
    start = int(input('Enter the first integer of the list: '))
    end = int(input('Enter the last integer of the list: '))

    if abs(start - end) > 1000:
        print('Error: Support only 1000 items or less')
        continue
    if start < 0 or end < 0:
        print('Error: Support only positive integers')
        continue
    break

excludelist = askExclude()


print()

ranklist = [n for n in range(start, end + 1)]
print(ranklist)
print(excludelist)
for item in excludelist:
    try:
        ranklist.remove(int(item))
    except ValueError:
        print('Exclude list not match, please enter again')
        askExclude()


print_rank(rank(ranklist), 'green', head='\nRanking Results:')
