import { type RequestComment, type Request, type RequestEvent, type User } from "@prisma/client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useRef, type FC, useMemo } from "react";
import getRandomAvatar from "~/helpers/getRandomAvatar";
import { api } from "~/utils/api";
import AddComment from "~/components/Comment/Add";
import EditComment from "~/components/Comment/Edit";
import DeleteComment from "./Delete";
import useEventDescription from "~/hooks/useEventDescription";

type Props = {
  request: Request;
}

export const CommentList: FC<Props> = ({ request }) => {
  const { data: session } = useSession();
  const { 
    data: comments, 
    isLoading: isLoadingComments, 
    refetch: refetchComments,
  } = api.requestComment.getAllByRequestId.useQuery({
    requestId: request.id,
    includeUser: true,
  });
  const { 
    data: events,
    isLoading: isLoadingEvents,
    refetch: refetchEvents,
  } = api.requestEvent.getAllByRequestId.useQuery({
    requestId: request.id,
    includeUser: true,
  });
  const refetch = () => {
    void refetchComments();
    void refetchEvents();
  };
  const isLoading = isLoadingComments || isLoadingEvents;
  const commentContainer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (commentContainer.current) {
      commentContainer.current.scrollTop = commentContainer.current.scrollHeight;
    }
  }, [comments]);
  const timestamp = (record: RequestComment | RequestEvent) => record.updatedAt ?? record.createdAt;
  const isEdited = (record: RequestComment | RequestEvent) => record.updatedAt?.getTime() > record.createdAt.getTime();
  
  const commentsAndEvents = useMemo(() => {
    if (!comments || !events) return [];
    const all = [...comments, ...events];
    return all.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [comments, events]);

  const Comment: FC<{ comment: RequestComment & { user: User } }> = ({ comment }) => {
    return (
      <div className={`chat chat-${comment.userId === session?.user?.id ? 'end' : 'start'}`}>
        <div className="chat-image avatar">
          <div className="w-10 rounded-full">
            <Image
              src={comment.user.image ?? getRandomAvatar()}
              alt="User"
              width={72}
              height={72}
            />
          </div>
        </div>
        <div className="chat-header flex items-center gap-1">
          {comment.user.name}
          <span>•</span>
          <time className="text-xs opacity-50">
            {timestamp(comment).toLocaleDateString([], {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            })}
          </time>
          {isEdited(comment) && (
            <span className="text-xs opacity-50">edited</span>
          )}
        </div>
        <div className={`chat-bubble ${comment.userId === session?.user?.id ? 'chat-bubble-secondary' : ''}`}>
          {comment.comment}
        </div>
        {(session?.user?.id === comment.userId || session?.user?.isAdmin) && (
          <div className="chat-footer opacity-50">
            <EditComment
              comment={comment}
              onCommentUpdated={() => void refetch()}
            />
            <span>•</span>
            <DeleteComment 
              comment={comment}
              onCommentDeleted={() => void refetch()}
            />
          </div>
        )}
      </div>
    )
  };

  const Event: FC<{ event: RequestEvent & { user: User } }> = ({ event }) => {
    const eventDescription = useEventDescription(event);
    return (
      <div className="lg:divider py-4">
        <div className="flex w-full text-center flex-col">
          <div className="flex justify-center items-start gap-2">
            <div className="avatar">
              <div className="w-4 rounded-full">
                <Image
                  src={event.user.image ?? getRandomAvatar()}
                  alt={event.user.name ?? "user"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </div>
            </div>

            <span className="text-xs opacity-50 lg:whitespace-wrap">
              {eventDescription}
            </span>
          </div>
          <time className="text-xs opacity-50">
            {event.createdAt.toLocaleDateString([], {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            })}
          </time>
        </div>
      </div>
    )
  };

  if (!commentsAndEvents && isLoading) {
    return (
      <div className="p-8 bg-base-300 rounded-lg min-h-[300px] max-h-[600px] overflow-y-auto">
        <div className="chat chat-start">
          <div className="chat-image avatar">
            <div className="w-10 h-10 bg-base-200 rounded-full" />
          </div>
          <div className="chat-header">
            Obi-Wan Kenobi
            <time className="text-xs opacity-50">12:45</time>
          </div>
          <div className="chat-bubble w-full h-24" />
          <div className="chat-footer opacity-50">
            Delivered
          </div>
        </div>
        <div className="chat chat-end">
          <div className="chat-image avatar">
            <div className="w-10 rounded-full">
              <Image
                src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg"
                alt="User"
                width={32}
                height={32}
              />
            </div>
          </div>
          <div className="chat-header">
            Anakin
            <time className="text-xs opacity-50">12:46</time>
          </div>
          <div className="chat-bubble w-32 h-12" />
          <div className="chat-footer opacity-50">
            Seen at 12:46
          </div>
        </div>
      </div>
    )
  }
  if (!commentsAndEvents && !isLoading) return (
    <div className="flex flex-col gap-2">
      <div className="p-8 bg-base-300 rounded-lg min-h-[300px] max-h-[600px] overflow-y-auto" />
      <AddComment 
        request={request} 
        onCommentAdded={() => void refetch()} 
      />
    </div>
  );
  return (
    <div className="flex flex-col gap-2">
      <div ref={commentContainer} className="p-8 bg-base-300 rounded-lg min-h-[300px] max-h-[600px] overflow-y-auto">
        {commentsAndEvents.map((commentOrEvent) => {
          // figure out if this is a comment or an event
          const comment = commentOrEvent as RequestComment & { user: User };
          const event = commentOrEvent as RequestEvent & { user: User };
          if (comment.comment) {
            return (
              <Comment 
                key={`comment-${commentOrEvent.id}`} 
                comment={comment} 
              />
            )
          }
          return (
            <Event key={`event-${event.id}`} event={event} />
          )
        })}
      </div>
      <AddComment 
        request={request} 
        onCommentAdded={() => void refetch()} 
      />
    </div>
  )
};

export default CommentList;