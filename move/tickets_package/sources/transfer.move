module tickets_package::transfer{ 
    use sui::transfer;
    use sui::tx_context::TxContext;

    public fun transfer_client(client: Ticket, recipient: address) {
        transfer::public_transfer(client, recipient);
}
}