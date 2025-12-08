class MyClass:
    def __init__(self, name):
        self.name = name

    def greet(self):
        if self.name:
            print(f"Hello, {self.name}!")
        else:
            print("Hello, stranger!")

def process_data(items):
    result = []
    for item in items:
        if item > 0:
            result.append(item * 2)
        elif item < 0:
            result.append(item * -1)
        else:
            result.append(0)
    return result

def safe_divide(a, b):
    try:
        result = a / b
    except ZeroDivisionError:
        print("Cannot divide by zero")
        result = None
    finally:
        print("Division attempt completed")
    return result

counter = 0
while counter < 5:
    print(f"Count: {counter}")
    counter += 1

with open("test.txt", "w") as f:
    f.write("Hello, World!")
