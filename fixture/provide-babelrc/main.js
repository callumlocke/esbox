function dec(id) {
  console.log('evaluated', id);
  return () => console.log('executed', id);
}

class Example {
  @dec(1)
  @dec(2)
  method() { }
}

console.log(Example);
