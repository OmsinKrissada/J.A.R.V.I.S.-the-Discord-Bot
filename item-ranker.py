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
        cprint(head, color, attrs=['bold'])
    for i, item in enumerate(list):
        cprint(
            f'{INDENT}{pad(str(i + 1), len(str(len(list))))}:{INDENT}{item}', color)


def insert_elems(start, list, index):
    list = list[::-1]
    for item in list:
        start.insert(index, item)
    return start


def is_better(a, b):
    reversed = True if randint(0, 1) == 1 else False
    while True:
        print('Which is better? ')
        if not reversed:
            print(str(a))
            print(' or ')
            print(str(b))
        else:
            print(str(b))
            print(' or ')
            print(str(a))
        print(': ')

        user_input = input()

        if user_input == str(a):
            return True
        elif user_input == str(b):
            return False
        else:
            print('Invalid choice. Choose again.')


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


sys.stdout.write(['text', 'Item ranker by comparison\n'])

start = int(input('Enter the first integer of the list: '))
end = int(input('Enter the last integer of the list: '))

excludelist = askExclude()


print()

ranklist = [n for n in range(start, end + 1)]
print(ranklist)
print(excludelist)
for item in excludelist:
    ranklist.remove(int(item))


print_rank(rank(ranklist), 'green', head='\nRanking Results:')
