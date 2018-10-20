function ListNode(val) {
  this.val = val
  this.next = null
}
const printNum = node => {
  const num = []
  while (node) {
    num.push(node.val)
    node = node.next
  }
  console.log(num.join('->'))
}

var addTwoNumbers = function(l1, l2) {
  const res = []
  let carry = 0
  while (l1 || l2) {
    if (l1 && l2) {
      console.log(
        l1.val +
          '+' +
          l2.val +
          '+' +
          carry +
          '=' +
          ((l1.val + l2.val + carry) % 10)
      )
      res.push((l1.val + l2.val + carry) % 10)
      if (l1.val + l2.val + carry >= 10) {
        carry = 1
      } else {
        carry = 0
      }
      l1 = l1.next
      l2 = l2.next
    } else if (l1) {
      if (l1.val + carry >= 10) {
        carry = 1
      } else {
        carry = 0
      }
      res.push((l1.val + carry) % 10)
      l1 = l1.next
    } else if (l2) {
      if (l2.val + carry >= 10) {
        carry = 1
      } else {
        carry = 0
      }
      res.push((l2.val + carry) % 10)
      l2 = l2.next
    }
  }
  if (carry) {
    res.push(carry)
  }
  let head
  let node
  for (let i = 0; i < res.length; i++) {
    if (i === 0) {
      node = new ListNode(res[i])
      head = node
    } else {
      node.next = new ListNode(res[i])
      node = node.next
    }
  }
  return head
}

const genNum = (...nums) => {
  let head
  let node
  for (let i = 0; i < nums.length; i++) {
    if (i === 0) {
      node = new ListNode(nums[i])
      head = node
    } else {
      node.next = new ListNode(nums[i])
      node = node.next
    }
  }
  return head
}

const l1 = genNum(2, 4, 3)
const l2 = genNum(5, 6, 4)

printNum(addTwoNumbers(l1, l2))
