from pyteal import *


class Auction:
    class Variables:  # 4 global ints, 5 global bytes
        duration = Bytes("DURATION")
        auction_start = Bytes("AUCTIONSTART")  # uint64
        auction_end = Bytes("AUCTIONEND")  # uint64
        item_name = Bytes("NAME")  # bytes
        item_image = Bytes("IMAGE")  # bytes
        item_description = Bytes("DESC")  # bytes
        item_owner = Bytes("OWNER")  # bytes
        starting_bid = Bytes("STARTINGBID")  # uint64
        highest_bid = Bytes("HIGHESTBID")  # uint64
        highest_bidder = Bytes("HIGHESTBIDDER")  # bytes
        status = Bytes("STATUS")  # uint64 0: created 1: started 2: ended

    class AppMethods:
        start = Bytes("start")
        bid = Bytes("bid")
        end = Bytes("end")

    def application_creation(self):
        # args = duration, item_name, item_image, item_desc, starting_bid
        return Seq(
            [
                # check args length
                Assert(Txn.application_args.length() == Int(5)),
                # check for Txn note
                Assert(Txn.note() == Bytes("auction:uv2")),
                # check that auction duration is greater than 0
                Assert(Btoi(Txn.application_args[0]) > Int(0)),
                # check that starting bid is greater than 0
                Assert(Btoi(Txn.application_args[4]) > Int(0)),
                # set variables
                App.globalPut(self.Variables.duration, Btoi(Txn.application_args[0])),
                App.globalPut(self.Variables.item_name, Txn.application_args[1]),
                App.globalPut(self.Variables.item_image, Txn.application_args[2]),
                App.globalPut(self.Variables.item_description, Txn.application_args[3]),
                App.globalPut(self.Variables.item_owner, Global.creator_address()),
                App.globalPut(
                    self.Variables.starting_bid, Btoi(Txn.application_args[4])
                ),
                App.globalPut(
                    self.Variables.highest_bid, Btoi(Txn.application_args[4])
                ),
                App.globalPut(self.Variables.highest_bidder, Global.zero_address()),
                App.globalPut(self.Variables.status, Int(0)),
                Approve(),
            ]
        )

    def start(self):
        # function to deposit 1 algo to the contract and set the auction to active
        duration = App.globalGet(self.Variables.duration)
        return Seq(
            [
                Assert(
                    # check transaction group
                    Global.group_size() == Int(2),
                    # check that the this start txn is made ahead of the payment transaction
                    Txn.group_index() == Int(0),
                    And(
                        Gtxn[1].type_enum() == TxnType.Payment,
                        Gtxn[1].receiver() == Global.current_application_address(),
                        Gtxn[1].amount() == Int(1000000),
                        Gtxn[1].sender() == Gtxn[0].sender(),
                    ),
                ),
                # start the timer variables
                App.globalPut(self.Variables.auction_start, Global.latest_timestamp()),
                App.globalPut(
                    self.Variables.auction_end, (Global.latest_timestamp() + duration)
                ),
                # set auction to started
                App.globalPut(self.Variables.status, Int(1)),
                Approve(),
            ]
        )

    @Subroutine(TealType.none)
    def pay(receiver: Expr, amount: Expr):
        return Seq(
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields(
                {
                    TxnField.type_enum: TxnType.Payment,
                    TxnField.receiver: receiver,
                    TxnField.amount: amount,
                    TxnField.fee: Int(0),
                }
            ),
            InnerTxnBuilder.Submit(),
        )

    def bid(self):
        valid_number_of_transactions = Global.group_size() == Int(2)
        valid_grouping = Txn.group_index() == Int(0)
        bid_amount = Gtxn[1].amount()
        previous_bidder = App.globalGet(self.Variables.highest_bidder)
        previous_bid = App.globalGet(self.Variables.highest_bid)
        starting_bid = App.globalGet(self.Variables.starting_bid)
        status = App.globalGet(self.Variables.status)

        # check that transaction params are valid and bid is greater than current highest bid
        valid_bid_payment_txn = And(
            Gtxn[1].type_enum() == TxnType.Payment,
            Gtxn[1].receiver() == Global.current_application_address(),
            Gtxn[1].amount() > previous_bid,
            Gtxn[1].sender() == Gtxn[0].sender(),
        )

        # auction is still on
        auction_still_on = And(
            Global.latest_timestamp() < App.globalGet(self.Variables.auction_end),
            status == Int(1),
        )

        # all validates
        can_bid = And(
            valid_number_of_transactions,
            valid_grouping,
            valid_bid_payment_txn,
            auction_still_on,
        )

        # check that values are not the same as initial values
        bid_was_made = And(
            previous_bidder != Global.zero_address(),
            starting_bid != previous_bid,
            Txn.accounts[1] == previous_bidder,
        )

        update_bids = Seq(
            [
                App.globalPut(self.Variables.highest_bid, bid_amount),
                App.globalPut(self.Variables.highest_bidder, Gtxn[0].sender()),
            ]
        )

        return Seq(
            [
                If(can_bid)
                .Then(
                    Seq(
                        [
                            If(bid_was_made).Then(
                                # require first transaction fee to cover:
                                # - own transaction fee
                                # - payment transaction fee
                                # - refund transaction fee
                                Assert(Txn.fee() >= Global.min_txn_fee() * Int(3)),
                                # refund previous buyer
                                self.pay(Txn.accounts[1], previous_bid),
                            ),
                            update_bids,
                            Approve(),
                        ]
                    )
                )
                .Else(Reject())
            ]
        )

    def end_auction(self):
        auction_end = App.globalGet(self.Variables.auction_end)
        owner = App.globalGet(self.Variables.item_owner)
        highest_bid = App.globalGet(self.Variables.highest_bid)
        highest_bidder = App.globalGet(self.Variables.highest_bidder)
        starting_bid = App.globalGet(self.Variables.starting_bid)
        status = App.globalGet(self.Variables.status)

        bid_was_made = And(highest_bidder != Bytes(""), starting_bid != highest_bid)

        return Seq(
            [
                # check that auction has ended
                Assert(Global.latest_timestamp() > auction_end),
                # check that status is set to 1
                Assert(status == Int(1)),
                Assert(owner == Txn.sender()),
                If(bid_was_made).Then(
                    Seq(
                        # require first transaction fee to cover:
                        # - own transaction fee
                        # - payment transaction fee
                        Assert(Txn.fee() >= Global.min_txn_fee() * Int(2)),
                        # send highest bid to item owner
                        self.pay(Global.creator_address(), highest_bid),
                        # update owner of item
                        App.globalPut(self.Variables.item_owner, highest_bidder),
                    )
                ),
                # update auction status
                App.globalPut(self.Variables.status, Int(2)),
                Approve(),
            ]
        )

    def application_deletion(self):
        return Return(
            And(
                # user is owner
                Txn.sender() == App.globalGet(self.Variables.item_owner),
                # auction status is not active
                App.globalGet(self.Variables.status) != Int(1),
            )
        )

    def application_start(self):
        return Cond(
            [Txn.application_id() == Int(0), self.application_creation()],
            [
                Txn.on_completion() == OnComplete.DeleteApplication,
                self.application_deletion(),
            ],
            [Txn.application_args[0] == self.AppMethods.start, self.start()],
            [Txn.application_args[0] == self.AppMethods.bid, self.bid()],
            [Txn.application_args[0] == self.AppMethods.end, self.end_auction()],
        )

    def approval_program(self):
        return self.application_start()

    def clear_program(self):
        return Return(Int(1))
