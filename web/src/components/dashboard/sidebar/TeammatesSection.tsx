import { SearchIcon, UserAddIcon } from '@heroicons/react/outline';
import ModalButton from 'components/dashboard/ModalButton';
import { useWorkspaceById } from 'hooks/useWorkspaces';
import {
  CreateMessageContext,
  DirectMessagesContext,
  InviteTeammatesContext,
  UserContext,
  UsersContext,
} from 'lib/context';
import { useTheme } from 'lib/hooks';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { postData } from 'utils/api-helpers';
import { getHref } from 'utils/get-file-url';

function MemberItem({
  id,
  owner,
  member,
}: {
  id: string;
  owner: boolean;
  member: any;
}) {
  const { themeColors } = useTheme();
  const { user } = useContext(UserContext);
  const { workspaceId } = useParams();
  const { setOpen: setOpenCreateMessage, setSection } =
    useContext(CreateMessageContext);
  const photoURL = getHref(member?.thumbnailURL) || getHref(member?.photoURL);

  const isMe = user?.uid === id;

  const { value: directs } = useContext(DirectMessagesContext);

  const [openDirect, setOpenDirect] = useState<any>(null);

  useEffect(() => {
    if (directs) {
      setOpenDirect(
        isMe
          ? directs.find(
              (direct: any) =>
                direct.active.includes(user?.uid) && direct.members.length === 1
            )
          : directs.find(
              (direct: any) =>
                direct.active.includes(user?.uid) && direct.members.includes(id)
            )
      );
    }
  }, [directs, user?.uid]);

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const newMessage = async () => {
    setLoading(true);
    try {
      const { directId } = await postData('/directs', {
        workspaceId,
        userId: id,
      });
      navigate(`/dashboard/workspaces/${workspaceId}/dm/${directId}`);
      setOpenCreateMessage(false);
      setSection('members');
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <li className="px-8 py-2 flex justify-between items-center cursor-pointer group">
      <div className="flex items-center group-hover:w-4/6 w-full">
        <img
          className="rounded mr-4 h-10 w-10"
          src={photoURL || `${process.env.PUBLIC_URL}/blank_user.png`}
          alt={id}
        />
        <div
          className="font-bold truncate"
          style={{ color: themeColors?.foreground }}
        >
          {member?.fullName}
          {id === user?.uid && (
            <span
              className="font-normal opacity-70 ml-1"
              style={{ color: themeColors?.foreground }}
            >
              (me)
            </span>
          )}
          {owner && (
            <span
              className="font-normal opacity-70 ml-1"
              style={{ color: themeColors?.foreground }}
            >
              {' '}
              - owner
            </span>
          )}
        </div>
      </div>
      <ModalButton
        isSubmitting={loading}
        text="New message"
        onClick={
          openDirect
            ? () => {
                navigate(
                  `/dashboard/workspaces/${workspaceId}/dm/${openDirect.objectId}`
                );
                setOpenCreateMessage(false);
              }
            : () => newMessage()
        }
        className="w-full sm:ml-3 justify-center items-center py-2 px-4 border border-transparent text-base font-bold rounded text-white focus:outline-none focus:ring-4 focus:ring-blue-200 sm:w-auto sm:text-sm disabled:opacity-50 hidden group-hover:inline-flex"
      />
    </li>
  );
}

export default function TeammatesSection() {
  const { setOpen: setOpenInviteTeammates } = useContext(
    InviteTeammatesContext
  );
  const { setOpen: setOpenCreateMessage } = useContext(CreateMessageContext);

  const { workspaceId } = useParams();
  const { value } = useWorkspaceById(workspaceId);

  const [search, setSearch] = useState('');
  const { value: members, loading } = useContext(UsersContext);

  const displayMembers = useMemo(
    () =>
      members.reduce((result: any, member: any) => {
        if (
          member?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          member?.displayName?.toLowerCase().includes(search.toLowerCase())
        )
          result.push(member);
        return result;
      }, []),
    [members, search]
  );

  if (loading) return null;

  return (
    <>
      <div className="px-8 w-full">
        <div className="flex items-center border w-full shadow-sm rounded px-2 th-color-for th-bg-bg th-border-selbg">
          <SearchIcon className="h-5 w-5 th-color-for" />
          <input
            type="text"
            name="findMembers"
            id="findMembers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find members"
            className="block text-base border-0 w-full focus:outline-none focus:ring-0 th-bg-bg"
          />
        </div>
      </div>
      <ul className="w-full mt-6 overflow-y-scroll" style={{ height: '460px' }}>
        <li
          className="px-8 py-2 flex items-center cursor-pointer"
          onClick={() => {
            setOpenCreateMessage(false);
            setOpenInviteTeammates(true);
          }}
        >
          <div className="rounded p-2 mr-4">
            <UserAddIcon className="h-6 w-6 th-color-for" />
          </div>
          <span className="font-bold th-color-for">Invite member</span>
        </li>
        {displayMembers.map((member: any) => (
          <MemberItem
            key={member.objectId}
            id={member.objectId}
            owner={value?.ownerId === member.objectId}
            member={member}
          />
        ))}
      </ul>
    </>
  );
}
