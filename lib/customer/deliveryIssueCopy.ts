/** Maps API `deliveryIssue.code` to customer-facing copy when status is `delivery_failed`. */
export function deliveryIssueMessage(code: number): string {
  switch (code) {
    case 1:
      return "We couldn’t complete delivery at your address. The store may try again or contact you.";
    default:
      return `A delivery issue occurred (reference ${code}).`;
  }
}
